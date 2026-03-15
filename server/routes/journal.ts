import { type Express } from "express";
import { createHash } from "crypto";
import { db } from "../db";
import { journalEntries } from "../tables";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertJournalEntrySchema,
  updateJournalEntrySchema,
} from "../../shared/schema";

// ----------------------------------------------------------
// Helpers
// ----------------------------------------------------------

function generateContentHash(
  content: string,
  userId: string,
  createdAt: string,
): string {
  return createHash("sha256")
    .update(content + userId + createdAt)
    .digest("hex");
}

function parsePageParams(query: {
  page?: string;
  limit?: string;
}): { offset: number; limit: number } {
  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "50", 10) || 50));
  return { offset: (page - 1) * limit, limit };
}

// ----------------------------------------------------------
// Route Registration
// ----------------------------------------------------------

export function registerJournalRoutes(app: Express): void {
  // ----------------------------------------------------------
  // POST /api/journal - Create a new journal entry
  // ----------------------------------------------------------
  app.post("/api/journal", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const validated = insertJournalEntrySchema.parse(req.body);
      const createdAt = new Date().toISOString();
      const contentHash = generateContentHash(validated.content, userId, createdAt);

      const [entry] = await db
        .insert(journalEntries)
        .values({
          user_id: userId,
          title: validated.title,
          content: validated.content,
          mood: validated.mood ?? null,
          tags: validated.tags ?? [],
          content_hash: contentHash,
          created_at: createdAt,
          updated_at: createdAt,
        })
        .returning();

      res.status(201).json(entry);
    } catch (error) {
      console.error("[Journal] Create error:", error);
      res.status(400).json({ error: "Failed to create journal entry" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/journal - List entries for the authenticated user
  // ----------------------------------------------------------
  app.get("/api/journal", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const moodFilter = req.query.mood as string | undefined;
      const tagFilter = req.query.tag as string | undefined;
      const { offset, limit } = parsePageParams(req.query as { page?: string; limit?: string });

      const conditions = [eq(journalEntries.user_id, userId)];

      if (moodFilter) {
        conditions.push(eq(journalEntries.mood, moodFilter));
      }

      if (tagFilter) {
        conditions.push(
          sql`${journalEntries.tags}::jsonb @> ${JSON.stringify([tagFilter])}::jsonb`,
        );
      }

      const whereClause = and(...conditions);

      const [entries, [totalRow]] = await Promise.all([
        db
          .select()
          .from(journalEntries)
          .where(whereClause)
          .orderBy(desc(journalEntries.created_at))
          .limit(limit)
          .offset(offset),
        db
          .select({ total: count() })
          .from(journalEntries)
          .where(whereClause),
      ]);

      res.json({ data: entries, total: totalRow.total });
    } catch (error) {
      console.error("[Journal] List error:", error);
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  // ----------------------------------------------------------
  // PATCH /api/journal/:id - Update a journal entry
  // ----------------------------------------------------------
  app.patch("/api/journal/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const entryId = req.params.id;
      const validated = updateJournalEntrySchema.parse(req.body);

      const [existing] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId));

      if (!existing) {
        res.status(404).json({ error: "Journal entry not found" });
        return;
      }

      if (existing.user_id !== userId) {
        res.status(403).json({ error: "Not authorized to update this entry" });
        return;
      }

      const updatedAt = new Date().toISOString();
      const contentChanged = validated.content !== undefined;
      const newContentHash = contentChanged
        ? generateContentHash(validated.content!, userId, existing.created_at)
        : existing.content_hash;

      const [updated] = await db
        .update(journalEntries)
        .set({
          ...validated,
          content_hash: newContentHash,
          updated_at: updatedAt,
        })
        .where(eq(journalEntries.id, entryId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[Journal] Update error:", error);
      res.status(400).json({ error: "Failed to update journal entry" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/journal/:id - Delete a journal entry
  // ----------------------------------------------------------
  app.delete("/api/journal/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const entryId = req.params.id;

      const [existing] = await db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId));

      if (!existing) {
        res.status(404).json({ error: "Journal entry not found" });
        return;
      }

      if (existing.user_id !== userId) {
        res.status(403).json({ error: "Not authorized to delete this entry" });
        return;
      }

      await db
        .delete(journalEntries)
        .where(eq(journalEntries.id, entryId));

      res.status(204).send();
    } catch (error) {
      console.error("[Journal] Delete error:", error);
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });
}
