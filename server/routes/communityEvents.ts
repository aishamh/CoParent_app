import { type Express } from "express";
import { db } from "../db";
import {
  communityEvents,
  eventAttendees,
  carpoolArrangements,
  eventNotifications,
  children,
  users,
} from "../tables";
import {
  eq,
  and,
  desc,
  gte,
  lte,
  or,
  inArray,
  count,
} from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertCommunityEventSchema,
  updateCommunityEventSchema,
  insertEventAttendeeSchema,
  updateEventAttendeeSchema,
  insertCarpoolArrangementSchema,
  updateCarpoolArrangementSchema,
} from "../../shared/schema";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function parsePageParams(query: {
  page?: string;
  limit?: string;
}): { offset: number; limit: number } {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "50", 10) || 50));
  return { offset: (page - 1) * limit, limit };
}

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

function getDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function getDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split("T")[0];
}

// ----------------------------------------------------------
// Route Registration
// ----------------------------------------------------------

export function registerCommunityEventsRoutes(app: Express): void {
  // ========================================================
  // Community Events
  // ========================================================

  // POST /api/community-events — Create a new community event
  app.post("/api/community-events", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;
      const validated = insertCommunityEventSchema.parse(req.body);

      const [event] = await db
        .insert(communityEvents)
        .values({
          source: "user_created",
          family_id: familyId,
          title: validated.title,
          description: validated.description ?? null,
          event_date: validated.event_date,
          event_time: validated.event_time ?? null,
          end_time: validated.end_time ?? null,
          location: validated.location ?? null,
          address: validated.address ?? null,
          city: validated.city ?? null,
          latitude: validated.latitude ?? null,
          longitude: validated.longitude ?? null,
          category: validated.category ?? null,
          age_range_min: validated.age_range_min ?? null,
          age_range_max: validated.age_range_max ?? null,
          tags: validated.tags,
          image_url: validated.image_url ?? null,
          external_url: validated.external_url ?? null,
          price: validated.price ?? null,
          is_recurring: validated.is_recurring,
          recurrence_pattern: validated.recurrence_pattern ?? null,
          recurrence_end_date: validated.recurrence_end_date ?? null,
          capacity: validated.capacity ?? null,
        })
        .returning();

      // Schedule notifications for the creator
      await scheduleEventNotifications(userId, event.id, event.event_date);

      res.status(201).json(event);
    } catch (error) {
      console.error("[CommunityEvents] Create error:", error);
      res.status(400).json({ error: "Failed to create community event" });
    }
  });

  // GET /api/community-events — List community events (discoverable)
  app.get("/api/community-events", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;

      // Query parameters
      const category = req.query.category as string | undefined;
      const source = req.query.source as string | undefined;
      const ageMin = req.query.age_min ? parseInt(req.query.age_min as string, 10) : undefined;
      const ageMax = req.query.age_max ? parseInt(req.query.age_max as string, 10) : undefined;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;
      const { offset, limit } = parsePageParams(req.query as any);
      const includeUserAttended = req.query.include_attended === "true";

      // Get family's children ages for filtering
      const familyChildren = await db
        .select({ age: children.age, id: children.id })
        .from(children)
        .where(eq(children.family_id, familyId));

      const childAges = familyChildren.map((c) => c.age);
      const childIds = familyChildren.map((c) => c.id);

      // Build conditions
      const conditions: any[] = [];

      // Filter by date range (default: today + 30 days)
      const defaultFrom = getTodayDate();
      const defaultTo = getDaysFromNow(60);
      const fromDate = from || defaultFrom;
      const toDate = to || defaultTo;
      conditions.push(gte(communityEvents.event_date, fromDate));
      conditions.push(lte(communityEvents.event_date, toDate));

      // Filter by category
      if (category) {
        conditions.push(eq(communityEvents.category, category));
      }

      // Filter by source
      if (source) {
        conditions.push(eq(communityEvents.source, source));
      }

      // Age-appropriate filtering
      const validAgeMin = ageMin ?? (childAges.length > 0 ? Math.min(...childAges) : undefined);
      const validAgeMax = ageMax ?? (childAges.length > 0 ? Math.max(...childAges) : undefined);

      if (validAgeMin !== undefined) {
        conditions.push(
          or(
            eq(communityEvents.age_range_min, null),
            lte(communityEvents.age_range_min, validAgeMin + 3), // Allow 3 years above min
          ),
        );
      }
      if (validAgeMax !== undefined) {
        conditions.push(
          or(
            eq(communityEvents.age_range_max, null),
            gte(communityEvents.age_range_max, validAgeMax - 3), // Allow 3 years below max
          ),
        );
      }

      const whereClause = and(...conditions);

      // Fetch events and user's RSVP status in parallel
      const [eventsData, userAttendances] = await Promise.all([
        db
          .select()
          .from(communityEvents)
          .where(whereClause)
          .orderBy(communityEvents.event_date)
          .limit(limit)
          .offset(offset),
        db
          .select({ event_id: eventAttendees.event_id, status: eventAttendees.status })
          .from(eventAttendees)
          .where(eq(eventAttendees.user_id, userId)),
      ]);

      // Add RSVP status to events
      const attendanceMap = new Map(
        userAttendances.map((a) => [a.event_id, a.status]),
      );

      const enrichedEvents = eventsData.map((event) => ({
        ...event,
        user_rsvp_status: attendanceMap.get(event.id) || null,
      }));

      // Calculate interest-based recommendations
      const interestTags = await getChildInterests(db, familyId);
      const recommendedEvents = filterByInterests(enrichedEvents, interestTags);

      res.json({
        data: enrichedEvents,
        recommended: includeUserAttended ? recommendedEvents : [],
        total: eventsData.length,
      });
    } catch (error) {
      console.error("[CommunityEvents] List error:", error);
      res.status(500).json({ error: "Failed to fetch community events" });
    }
  });

  // GET /api/community-events/summary — Summary for dashboard
  app.get("/api/community-events/summary", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;
      const today = getTodayDate();
      const weekFromNow = getDaysFromNow(7);

      const [
        upcomingEvents,
        userRsvps,
        totalThisMonth,
      ] = await Promise.all([
        // Events in next 7 days
        db
          .select()
          .from(communityEvents)
          .where(
            and(
              gte(communityEvents.event_date, today),
              lte(communityEvents.event_date, weekFromNow),
            ),
          )
          .orderBy(communityEvents.event_date)
          .limit(5),
        // User's RSVPs
        db
          .select({
            event_id: eventAttendees.event_id,
            status: eventAttendees.status,
          })
          .from(eventAttendees)
          .where(eq(eventAttendees.user_id, userId)),
        // Total events this month
        db
          .select({ total: count() })
          .from(communityEvents)
          .where(gte(communityEvents.event_date, today)),
      ]);

      // RSVP counts per event
      const rsvpCounts = await Promise.all(
        upcomingEvents.map(async (event) => {
          const [countRow] = await db
            .select({ total: count() })
            .from(eventAttendees)
            .where(
              and(
                eq(eventAttendees.event_id, event.id),
                eq(eventAttendees.status, "going"),
              ),
            );
          return { event_id: event.id, going_count: countRow.total };
        }),
      );

      const rsvpMap = new Map(
        (req as any).userRsvps?.map((r: any) => [r.event_id, r.status]) || [],
      );
      const countMap = new Map(
        rsvpCounts.map((r) => [r.event_id, r.going_count]),
      );

      const enrichedUpcoming = upcomingEvents.map((event) => ({
        ...event,
        user_rsvp_status: rsvpMap.get(event.id) || null,
        going_count: countMap.get(event.id) || 0,
      }));

      res.json({
        upcoming_week: enrichedUpcoming,
        total_this_month: totalThisMonth[0]?.total || 0,
        your_rsvps: userRsvps.length,
      });
    } catch (error) {
      console.error("[CommunityEvents] Summary error:", error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

  // GET /api/community-events/:id — Get single event with attendees
  app.get("/api/community-events/:id", requireAuth, async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId: string = (req as any).userId;

      const [event] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, eventId));

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Get attendees with user info
      const attendeesData = await db
        .select({
          attendee: eventAttendees,
          username: users.username,
          display_name: users.display_name,
        })
        .from(eventAttendees)
        .leftJoin(users, eq(eventAttendees.user_id, users.id))
        .where(eq(eventAttendees.event_id, eventId));

      const [userAttendance] = attendeesData.filter(
        (a) => a.attendee.user_id === userId,
      );

      // Get carpool arrangements
      const carpools = await db
        .select()
        .from(carpoolArrangements)
        .where(
          and(
            eq(carpoolArrangements.event_id, eventId),
            eq(carpoolArrangements.status, "open"),
          ),
        );

      res.json({
        ...event,
        user_rsvp_status: userAttendance?.attendee.status || null,
        attendees: attendeesData.map((a) => ({
          id: a.attendee.id,
          user_id: a.attendee.user_id,
          username: a.username,
          display_name: a.display_name,
          status: a.attendee.status,
          attending_children: a.attendee.attending_children,
          notes: a.attendee.notes,
        })),
        carpools,
      });
    } catch (error) {
      console.error("[CommunityEvents] Get single error:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // PATCH /api/community-events/:id — Update event (user-created only)
  app.patch("/api/community-events/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const eventId = req.params.id;
      const validated = updateCommunityEventSchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, eventId));

      if (!existing) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Only allow editing user-created events by the family
      if (existing.source !== "user_created" || existing.family_id !== (req as any).familyId) {
        res.status(403).json({ error: "Cannot edit this event" });
        return;
      }

      const [updated] = await db
        .update(communityEvents)
        .set({ ...validated, updated_at: new Date().toISOString() })
        .where(eq(communityEvents.id, eventId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[CommunityEvents] Update error:", error);
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  // DELETE /api/community-events/:id — Delete event (user-created only)
  app.delete("/api/community-events/:id", requireAuth, async (req, res) => {
    try {
      const eventId = req.params.id;
      const familyId: string = (req as any).familyId;

      const [existing] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, eventId));

      if (!existing) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Only allow deleting user-created events by the family
      if (existing.source !== "user_created" || existing.family_id !== familyId) {
        res.status(403).json({ error: "Cannot delete this event" });
        return;
      }

      // Delete related records
      await db.delete(eventNotifications).where(eq(eventNotifications.event_id, eventId));
      await db.delete(carpoolArrangements).where(eq(carpoolArrangements.event_id, eventId));
      await db.delete(eventAttendees).where(eq(eventAttendees.event_id, eventId));
      await db.delete(communityEvents).where(eq(communityEvents.id, eventId));

      res.status(204).send();
    } catch (error) {
      console.error("[CommunityEvents] Delete error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // ========================================================
  // Event Attendees (RSVP)
  // ========================================================

  // POST /api/community-events/:id/attend — RSVP to an event
  app.post("/api/community-events/:id/attend", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;
      const eventId = req.params.id;
      const validated = insertEventAttendeeSchema.parse(req.body);

      // Verify event exists
      const [event] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, eventId));

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Check if already attending
      const [existing] = await db
        .select()
        .from(eventAttendees)
        .where(
          and(eq(eventAttendees.event_id, eventId), eq(eventAttendees.user_id, userId)),
        );

      if (existing) {
        // Update existing
        const [updated] = await db
          .update(eventAttendees)
          .set({
            ...validated,
            updated_at: new Date().toISOString(),
          })
          .where(eq(eventAttendees.id, existing.id))
          .returning();

        // Schedule notifications if going
        if (validated.status === "going") {
          await scheduleEventNotifications(userId, eventId, event.event_date);
        } else {
          // Cancel pending notifications
          await cancelEventNotifications(userId, eventId);
        }

        res.json(updated);
        return;
      }

      // Create new attendance
      const [attendance] = await db
        .insert(eventAttendees)
        .values({
          event_id: eventId,
          user_id: userId,
          family_id: familyId,
          attending_children: validated.attending_children,
          status: validated.status,
          notes: validated.notes ?? null,
        })
        .returning();

      // Schedule notifications if going
      if (validated.status === "going") {
        await scheduleEventNotifications(userId, eventId, event.event_date);
      }

      res.status(201).json(attendance);
    } catch (error) {
      console.error("[CommunityEvents] Attend error:", error);
      res.status(400).json({ error: "Failed to RSVP to event" });
    }
  });

  // PATCH /api/community-events/:id/attendees/:attendeeId — Update attendance
  app.patch(
    "/api/community-events/:id/attendees/:attendeeId",
    requireAuth,
    async (req, res) => {
      try {
        const userId: string = (req as any).userId;
        const eventId = req.params.id;
        const attendeeId = req.params.attendeeId;
        const validated = updateEventAttendeeSchema.parse(req.body);

        const [existing] = await db
          .select()
          .from(eventAttendees)
          .where(
            and(
              eq(eventAttendees.id, attendeeId),
              eq(eventAttendees.event_id, eventId),
              eq(eventAttendees.user_id, userId),
            ),
          );

        if (!existing) {
          res.status(404).json({ error: "Attendance not found" });
          return;
        }

        const [updated] = await db
          .update(eventAttendees)
          .set({
            ...validated,
            updated_at: new Date().toISOString(),
          })
          .where(eq(eventAttendees.id, attendeeId))
          .returning();

        // Handle notifications based on new status
        if (validated.status === "going" && existing.status !== "going") {
          const [event] = await db
            .select()
            .from(communityEvents)
            .where(eq(communityEvents.id, eventId));
          if (event) {
            await scheduleEventNotifications(userId, eventId, event.event_date);
          }
        } else if (validated.status !== "going") {
          await cancelEventNotifications(userId, eventId);
        }

        res.json(updated);
      } catch (error) {
        console.error("[CommunityEvents] Update attendee error:", error);
        res.status(400).json({ error: "Failed to update attendance" });
      }
    },
  );

  // GET /api/community-events/:id/attendees — List all attendees
  app.get("/api/community-events/:id/attendees", requireAuth, async (req, res) => {
    try {
      const eventId = req.params.id;

      const attendeesData = await db
        .select({
          attendee: eventAttendees,
          username: users.username,
          display_name: users.display_name,
        })
        .from(eventAttendees)
        .leftJoin(users, eq(eventAttendees.user_id, users.id))
        .where(eq(eventAttendees.event_id, eventId));

      res.json(
        attendeesData.map((a) => ({
          id: a.attendee.id,
          user_id: a.attendee.user_id,
          username: a.username,
          display_name: a.display_name,
          status: a.attendee.status,
          attending_children: a.attendee.attending_children,
          notes: a.attendee.notes,
        })),
      );
    } catch (error) {
      console.error("[CommunityEvents] List attendees error:", error);
      res.status(500).json({ error: "Failed to fetch attendees" });
    }
  });

  // ========================================================
  // Carpool Arrangements
  // ========================================================

  // POST /api/community-events/:id/carpool — Create carpool arrangement
  app.post("/api/community-events/:id/carpool", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;
      const eventId = req.params.id;
      const validated = insertCarpoolArrangementSchema.parse(req.body);

      // Verify event exists and user is attending
      const [event] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, eventId));

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      const [attendance] = await db
        .select()
        .from(eventAttendees)
        .where(
          and(
            eq(eventAttendees.event_id, eventId),
            eq(eventAttendees.user_id, userId),
          ),
        );

      if (!attendance || attendance.status !== "going") {
        res.status(400).json({ error: "Must RSVP as 'going' to arrange carpool" });
        return;
      }

      // Check for existing arrangement
      const [existing] = await db
        .select()
        .from(carpoolArrangements)
        .where(
          and(
            eq(carpoolArrangements.event_id, eventId),
            eq(carpoolArrangements.user_id, userId),
            eq(carpoolArrangements.status, "open"),
          ),
        );

      if (existing) {
        res.status(400).json({ error: "You already have an open arrangement" });
        return;
      }

      const [arrangement] = await db
        .insert(carpoolArrangements)
        .values({
          event_id: eventId,
          user_id: userId,
          family_id: familyId,
          type: validated.type,
          capacity: validated.capacity ?? null,
          children_transporting: validated.children_transporting,
          pickup_location: validated.pickup_location ?? null,
          pickup_latitude: validated.pickup_latitude ?? null,
          pickup_longitude: validated.pickup_longitude ?? null,
          pickup_time: validated.pickup_time ?? null,
          notes: validated.notes ?? null,
        })
        .returning();

      res.status(201).json(arrangement);
    } catch (error) {
      console.error("[CommunityEvents] Create carpool error:", error);
      res.status(400).json({ error: "Failed to create carpool arrangement" });
    }
  });

  // GET /api/community-events/:id/carpool — List carpool arrangements
  app.get("/api/community-events/:id/carpool", requireAuth, async (req, res) => {
    try {
      const eventId = req.params.id;
      const type = req.query.type as string | undefined; // "need_ride" | "offering_ride"

      const conditions = [
        eq(carpoolArrangements.event_id, eventId),
        eq(carpoolArrangements.status, "open"),
      ];

      if (type) {
        conditions.push(eq(carpoolArrangements.type, type));
      }

      const carpoolsData = await db
        .select({
          carpool: carpoolArrangements,
          username: users.username,
          display_name: users.display_name,
        })
        .from(carpoolArrangements)
        .leftJoin(users, eq(carpoolArrangements.user_id, users.id))
        .where(and(...conditions));

      res.json(
        carpoolsData.map((c) => ({
          ...c.carpool,
          username: c.username,
          display_name: c.display_name,
        })),
      );
    } catch (error) {
      console.error("[CommunityEvents] List carpools error:", error);
      res.status(500).json({ error: "Failed to fetch carpool arrangements" });
    }
  });

  // PATCH /api/carpool/:id — Update carpool arrangement
  app.patch("/api/carpool/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const carpoolId = req.params.id;
      const validated = updateCarpoolArrangementSchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(carpoolArrangements)
        .where(eq(carpoolArrangements.id, carpoolId));

      if (!existing || existing.user_id !== userId) {
        res.status(404).json({ error: "Arrangement not found" });
        return;
      }

      const [updated] = await db
        .update(carpoolArrangements)
        .set({
          ...validated,
          updated_at: new Date().toISOString(),
        })
        .where(eq(carpoolArrangements.id, carpoolId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[CommunityEvents] Update carpool error:", error);
      res.status(400).json({ error: "Failed to update carpool arrangement" });
    }
  });

  // POST /api/carpool/:id/match/:withId — Match two arrangements
  app.post("/api/carpool/:id/match/:withId", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const carpoolId = req.params.id;
      const withId = req.params.withId;

      const [arrangement] = await db
        .select()
        .from(carpoolArrangements)
        .where(eq(carpoolArrangements.id, carpoolId));

      if (!arrangement || arrangement.user_id !== userId) {
        res.status(404).json({ error: "Arrangement not found" });
        return;
      }

      const [matchArrangement] = await db
        .select()
        .from(carpoolArrangements)
        .where(eq(carpoolArrangements.id, withId));

      if (!matchArrangement) {
        res.status(404).json({ error: "Match arrangement not found" });
        return;
      }

      // Verify they're for the same event
      if (arrangement.event_id !== matchArrangement.event_id) {
        res.status(400).json({ error: "Arrangements must be for the same event" });
        return;
      }

      // Verify they're complementary (one offering, one needing)
      if (arrangement.type === matchArrangement.type) {
        res.status(400).json({ error: "Cannot match same type arrangements" });
        return;
      }

      // Update both arrangements
      await db
        .update(carpoolArrangements)
        .set({
          status: "matched",
          matched_with: matchArrangement.user_id,
          updated_at: new Date().toISOString(),
        })
        .where(eq(carpoolArrangements.id, carpoolId));

      await db
        .update(carpoolArrangements)
        .set({
          status: "matched",
          matched_with: userId,
          updated_at: new Date().toISOString(),
        })
        .where(eq(carpoolArrangements.id, withId));

      res.json({ message: "Matched successfully", carpool_id: carpoolId });
    } catch (error) {
      console.error("[CommunityEvents] Match carpool error:", error);
      res.status(400).json({ error: "Failed to match arrangements" });
    }
  });

  // DELETE /api/carpool/:id — Cancel carpool arrangement
  app.delete("/api/carpool/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const carpoolId = req.params.id;

      const [existing] = await db
        .select()
        .from(carpoolArrangements)
        .where(eq(carpoolArrangements.id, carpoolId));

      if (!existing || existing.user_id !== userId) {
        res.status(404).json({ error: "Arrangement not found" });
        return;
      }

      // If matched, also update the matched arrangement
      if (existing.matched_with) {
        await db
          .update(carpoolArrangements)
          .set({ status: "open", matched_with: null, updated_at: new Date().toISOString() })
          .where(eq(carpoolArrangements.user_id, existing.matched_with));
      }

      await db.delete(carpoolArrangements).where(eq(carpoolArrangements.id, carpoolId));
      res.status(204).send();
    } catch (error) {
      console.error("[CommunityEvents] Delete carpool error:", error);
      res.status(500).json({ error: "Failed to delete carpool arrangement" });
    }
  });
}

// ----------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------

async function getChildInterests(db: any, familyId: string): Promise<string[]> {
  const familyChildren = await db
    .select({ interests: children.interests })
    .from(children)
    .where(eq(children.family_id, familyId));

  const allInterests: string[] = [];
  for (const child of familyChildren) {
    try {
      const parsed = JSON.parse(child.interests);
      allInterests.push(...parsed);
    } catch {
      // Ignore parse errors
    }
  }
  return [...new Set(allInterests)];
}

function filterByInterests(
  events: any[],
  interests: string[],
): any[] {
  if (interests.length === 0) return [];

  const interestSet = new Set(interests.map((i) => i.toLowerCase()));
  return events.filter((event) => {
    if (!event.tags || event.tags.length === 0) return false;
    return event.tags.some((tag: string) =>
      interestSet.has(tag.toLowerCase()),
    );
  });
}

async function scheduleEventNotifications(
  userId: string,
  eventId: string,
  eventDate: string,
): Promise<void> {
  const eventDateObj = new Date(eventDate);

  // Notification schedules: 7 days, 3 days, 1 day, same day (morning)
  const schedules = [
    { type: "7_days", days: 7, time: "09:00" },
    { type: "3_days", days: 3, time: "09:00" },
    { type: "1_day", days: 1, time: "09:00" },
    { type: "same_day", days: 0, time: "08:00" },
  ];

  for (const schedule of schedules) {
    const scheduledDate = new Date(eventDateObj);
    scheduledDate.setDate(scheduledDate.getDate() - schedule.days);
    const [hours, minutes] = schedule.time.split(":").map(Number);
    scheduledDate.setHours(hours, minutes, 0, 0);

    // Only schedule if it's in the future
    if (scheduledDate > new Date()) {
      await db.insert(eventNotifications).values({
        user_id: userId,
        event_id: eventId,
        notification_type: schedule.type as any,
        scheduled_at: scheduledDate.toISOString(),
        status: "pending",
      });
    }
  }
}

async function cancelEventNotifications(
  userId: string,
  eventId: string,
): Promise<void> {
  await db
    .update(eventNotifications)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(eventNotifications.user_id, userId),
        eq(eventNotifications.event_id, eventId),
        eq(eventNotifications.status, "pending"),
      ),
    );
}
