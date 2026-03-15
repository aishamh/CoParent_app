import { type Express } from "express";
import { db } from "../db";
import { exchangeRecords } from "../tables";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { requireAuth } from "../auth";
import { insertExchangeRecordSchema } from "../../shared/schema";

export function registerExchangeRoutes(app: Express): void {
  // ----------------------------------------------------------
  // POST /api/exchanges — Record a new exchange
  // ----------------------------------------------------------
  app.post("/api/exchanges", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const userId: string = (req as any).userId;
      const validated = insertExchangeRecordSchema.parse(req.body);

      const [record] = await db
        .insert(exchangeRecords)
        .values({
          family_id: familyId,
          type: validated.type,
          from_parent: validated.from_parent,
          to_parent: validated.to_parent,
          children: validated.children,
          latitude: validated.latitude,
          longitude: validated.longitude,
          accuracy: validated.accuracy,
          address: validated.address,
          timestamp: validated.timestamp,
          status: validated.status,
          notes: validated.notes ?? null,
          photo_url: validated.photo_url ?? null,
          recorded_by: userId,
        })
        .returning();

      res.status(201).json(record);
    } catch (error) {
      console.error("[Exchanges] Create error:", error);
      res.status(400).json({ error: "Failed to record exchange" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/exchanges — List exchanges for the family
  // ----------------------------------------------------------
  app.get("/api/exchanges", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const from = req.query.from as string | undefined;
      const to = req.query.to as string | undefined;

      const conditions = [eq(exchangeRecords.family_id, familyId)];
      if (from) conditions.push(gte(exchangeRecords.timestamp, from));
      if (to) conditions.push(lte(exchangeRecords.timestamp, to));

      const records = await db
        .select()
        .from(exchangeRecords)
        .where(and(...conditions))
        .orderBy(desc(exchangeRecords.timestamp));

      res.json(records);
    } catch (error) {
      console.error("[Exchanges] List error:", error);
      res.status(500).json({ error: "Failed to fetch exchanges" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/exchanges/:id — Get a single exchange record
  // ----------------------------------------------------------
  app.get("/api/exchanges/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const recordId = req.params.id;

      const [record] = await db
        .select()
        .from(exchangeRecords)
        .where(
          and(
            eq(exchangeRecords.id, recordId),
            eq(exchangeRecords.family_id, familyId),
          ),
        );

      if (!record) {
        res.status(404).json({ error: "Exchange record not found" });
        return;
      }

      res.json(record);
    } catch (error) {
      console.error("[Exchanges] Get error:", error);
      res.status(500).json({ error: "Failed to fetch exchange record" });
    }
  });
}
