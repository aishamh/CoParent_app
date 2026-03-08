import { type Express } from "express";
import { db } from "../db";
import { custodySchedules, custodySwapRequests, events } from "../tables";
import { eq, and, desc, gte } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertCustodyScheduleSchema,
  insertSwapRequestSchema,
} from "../../shared/schema";
import {
  generateCustodyDays,
  collapseToCustodyEvents,
} from "../services/custodyTemplates";
import { sendPushNotification } from "../services/notifications";

const PREVIEW_DAYS = 28;
const SCHEDULE_GENERATION_DAYS = 90;

export function registerCustodyRoutes(app: Express): void {

  // --- Preview a custody schedule (no DB write) ---

  app.post("/api/custody-schedules/preview", requireAuth, async (req, res) => {
    try {
      const { template_type, start_date, custom_pattern } = req.body;

      if (!template_type || !start_date) {
        return res
          .status(400)
          .json({ error: "template_type and start_date are required" });
      }

      const days = generateCustodyDays(
        template_type,
        start_date,
        PREVIEW_DAYS,
        custom_pattern
      );
      const blocks = collapseToCustodyEvents(days);

      res.json({ days, events: blocks });
    } catch (error) {
      console.error("[Custody] Preview error:", error);
      res.status(400).json({ error: "Invalid schedule preview data" });
    }
  });

  // --- Create a custody schedule and generate calendar events ---

  app.post("/api/custody-schedules", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const validated = insertCustodyScheduleSchema.parse(req.body);

      const [schedule] = await db
        .insert(custodySchedules)
        .values({
          family_id: familyId,
          child_id: validated.child_id ?? null,
          template_type: validated.template_type,
          start_date: validated.start_date,
          parent_a_id: validated.parent_a_id,
          parent_b_id: validated.parent_b_id,
          custom_pattern: validated.custom_pattern ?? null,
          is_active: true,
        })
        .returning();

      const days = generateCustodyDays(
        validated.template_type,
        validated.start_date,
        SCHEDULE_GENERATION_DAYS,
        validated.custom_pattern ?? undefined
      );
      const blocks = collapseToCustodyEvents(days);

      const eventRows = blocks.map((block) => {
        const parentId =
          block.parent === "A"
            ? validated.parent_a_id
            : validated.parent_b_id;

        return {
          family_id: familyId,
          title: `Custody: Parent ${block.parent}`,
          start_date: block.startDate,
          end_date: block.endDate,
          start_time: "00:00",
          end_time: "23:59",
          time_zone: "Europe/Oslo",
          parent: parentId,
          type: "custody",
          schedule_id: schedule.id,
        };
      });

      if (eventRows.length > 0) {
        await db.insert(events).values(eventRows);
      }

      res.status(201).json(schedule);
    } catch (error) {
      console.error("[Custody] Create schedule error:", error);
      res.status(400).json({ error: "Invalid custody schedule data" });
    }
  });

  // --- List active custody schedules for the family ---

  app.get("/api/custody-schedules", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      const schedules = await db
        .select()
        .from(custodySchedules)
        .where(
          and(
            eq(custodySchedules.family_id, familyId),
            eq(custodySchedules.is_active, true)
          )
        )
        .orderBy(desc(custodySchedules.created_at));

      res.json(schedules);
    } catch (error) {
      console.error("[Custody] List schedules error:", error);
      res.status(500).json({ error: "Failed to load custody schedules" });
    }
  });

  // --- Deactivate a custody schedule and remove future events ---

  app.delete("/api/custody-schedules/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const scheduleId = req.params.id;

      const [existing] = await db
        .select()
        .from(custodySchedules)
        .where(
          and(
            eq(custodySchedules.id, scheduleId),
            eq(custodySchedules.family_id, familyId)
          )
        );

      if (!existing) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      await db
        .update(custodySchedules)
        .set({ is_active: false })
        .where(eq(custodySchedules.id, scheduleId));

      const today = new Date().toISOString().split("T")[0];
      await db
        .delete(events)
        .where(
          and(
            eq(events.schedule_id, scheduleId),
            gte(events.start_date, today)
          )
        );

      res.status(204).send();
    } catch (error) {
      console.error("[Custody] Delete schedule error:", error);
      res.status(500).json({ error: "Failed to deactivate schedule" });
    }
  });

  // --- Create a custody swap request ---

  app.post("/api/custody-swap-requests", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;
      const validated = insertSwapRequestSchema.parse(req.body);

      const [schedule] = await db
        .select()
        .from(custodySchedules)
        .where(
          and(
            eq(custodySchedules.id, validated.schedule_id),
            eq(custodySchedules.family_id, familyId)
          )
        );

      if (!schedule) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const [swapRequest] = await db
        .insert(custodySwapRequests)
        .values({
          family_id: familyId,
          schedule_id: validated.schedule_id,
          requested_by: userId,
          original_date: validated.original_date,
          proposed_date: validated.proposed_date,
          reason: validated.reason ?? null,
          status: "pending",
        })
        .returning();

      const recipientId =
        userId === schedule.parent_a_id
          ? schedule.parent_b_id
          : schedule.parent_a_id;

      sendPushNotification(
        recipientId,
        {
          title: "Custody Swap Request",
          body: `A swap has been requested for ${validated.original_date} to ${validated.proposed_date}.`,
          data: { type: "custody_swap", swapId: swapRequest.id },
        },
        "custody"
      ).catch((err) => {
        console.error("[Custody] Push notification failed:", err);
      });

      res.status(201).json(swapRequest);
    } catch (error) {
      console.error("[Custody] Create swap request error:", error);
      res.status(400).json({ error: "Invalid swap request data" });
    }
  });

  // --- List swap requests for the family ---

  app.get("/api/custody-swap-requests", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      const requests = await db
        .select()
        .from(custodySwapRequests)
        .where(eq(custodySwapRequests.family_id, familyId))
        .orderBy(desc(custodySwapRequests.created_at));

      res.json(requests);
    } catch (error) {
      console.error("[Custody] List swap requests error:", error);
      res.status(500).json({ error: "Failed to load swap requests" });
    }
  });

  // --- Approve or decline a swap request ---

  app.patch("/api/custody-swap-requests/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const swapId = req.params.id;
      const { status } = req.body;

      if (status !== "approved" && status !== "declined") {
        return res
          .status(400)
          .json({ error: "Status must be 'approved' or 'declined'" });
      }

      const [existing] = await db
        .select()
        .from(custodySwapRequests)
        .where(
          and(
            eq(custodySwapRequests.id, swapId),
            eq(custodySwapRequests.family_id, familyId)
          )
        );

      if (!existing) {
        return res.status(404).json({ error: "Swap request not found" });
      }

      if (existing.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Swap request has already been resolved" });
      }

      const [updated] = await db
        .update(custodySwapRequests)
        .set({ status, responded_at: new Date().toISOString() })
        .where(eq(custodySwapRequests.id, swapId))
        .returning();

      if (status === "approved") {
        await applySwapToEvents(
          existing.schedule_id,
          existing.original_date,
          existing.proposed_date
        );
      }

      sendPushNotification(
        existing.requested_by,
        {
          title: `Swap Request ${status === "approved" ? "Approved" : "Declined"}`,
          body:
            status === "approved"
              ? `Your swap for ${existing.original_date} has been approved.`
              : `Your swap for ${existing.original_date} has been declined.`,
          data: { type: "custody_swap", swapId: updated.id },
        },
        "custody"
      ).catch((err) => {
        console.error("[Custody] Push notification failed:", err);
      });

      res.json(updated);
    } catch (error) {
      console.error("[Custody] Update swap request error:", error);
      res.status(500).json({ error: "Failed to update swap request" });
    }
  });
}

// --- Helper: swap parent assignments on calendar events ---

async function applySwapToEvents(
  scheduleId: string,
  originalDate: string,
  proposedDate: string
): Promise<void> {
  const matchingEvents = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.schedule_id, scheduleId),
        eq(events.type, "custody")
      )
    );

  for (const event of matchingEvents) {
    const overlapsOriginal =
      event.start_date <= originalDate && event.end_date >= originalDate;
    const overlapsProposed =
      event.start_date <= proposedDate && event.end_date >= proposedDate;

    if (overlapsOriginal || overlapsProposed) {
      const swappedParent =
        event.title === "Custody: Parent A"
          ? "Custody: Parent B"
          : "Custody: Parent A";

      await db
        .update(events)
        .set({ title: swappedParent })
        .where(eq(events.id, event.id));
    }
  }
}
