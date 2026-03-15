import { type Express } from "express";
import { db } from "../db";
import { childInfoEntries } from "../tables";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertChildInfoEntrySchema,
  updateChildInfoEntrySchema,
} from "../../shared/schema";

export function registerChildInfoRoutes(app: Express): void {
  // ----------------------------------------------------------
  // POST /api/child-info — Create a new info entry
  // ----------------------------------------------------------
  app.post("/api/child-info", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;
      const validated = insertChildInfoEntrySchema.parse(req.body);

      const [entry] = await db
        .insert(childInfoEntries)
        .values({
          family_id: familyId,
          child_id: validated.child_id,
          category: validated.category,
          label: validated.label,
          value: validated.value,
          updated_by: userId,
        })
        .returning();

      res.status(201).json(entry);
    } catch (error) {
      console.error("[ChildInfo] Create error:", error);
      res.status(400).json({ error: "Failed to create info entry" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/child-info/:childId — Get all entries for a child
  // ----------------------------------------------------------
  app.get("/api/child-info/:childId", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const childId = parseInt(req.params.childId, 10);

      if (isNaN(childId)) {
        res.status(400).json({ error: "Invalid child ID" });
        return;
      }

      const entries = await db
        .select()
        .from(childInfoEntries)
        .where(
          and(
            eq(childInfoEntries.family_id, familyId),
            eq(childInfoEntries.child_id, childId),
          ),
        )
        .orderBy(desc(childInfoEntries.updated_at));

      res.json(entries);
    } catch (error) {
      console.error("[ChildInfo] List error:", error);
      res.status(500).json({ error: "Failed to fetch info entries" });
    }
  });

  // ----------------------------------------------------------
  // PATCH /api/child-info/:id — Update an info entry
  // ----------------------------------------------------------
  app.patch("/api/child-info/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;
      const entryId = req.params.id;
      const validated = updateChildInfoEntrySchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(childInfoEntries)
        .where(
          and(
            eq(childInfoEntries.id, entryId),
            eq(childInfoEntries.family_id, familyId),
          ),
        );

      if (!existing) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      const [updated] = await db
        .update(childInfoEntries)
        .set({
          ...validated,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        })
        .where(eq(childInfoEntries.id, entryId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[ChildInfo] Update error:", error);
      res.status(400).json({ error: "Failed to update info entry" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/child-info/:id — Delete an info entry
  // ----------------------------------------------------------
  app.delete("/api/child-info/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const entryId = req.params.id;

      const [existing] = await db
        .select()
        .from(childInfoEntries)
        .where(
          and(
            eq(childInfoEntries.id, entryId),
            eq(childInfoEntries.family_id, familyId),
          ),
        );

      if (!existing) {
        res.status(404).json({ error: "Entry not found" });
        return;
      }

      await db
        .delete(childInfoEntries)
        .where(eq(childInfoEntries.id, entryId));

      res.json({ success: true });
    } catch (error) {
      console.error("[ChildInfo] Delete error:", error);
      res.status(500).json({ error: "Failed to delete info entry" });
    }
  });
}
