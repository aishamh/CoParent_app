import { type Express } from "express";
import { requireAuth } from "../auth";
import { toneCheckRequestSchema } from "../../shared/schema";
import { analyzeTone } from "../services/toneAnalysis";

export function registerToneRoutes(app: Express): void {
  // POST /api/tone-check -- Analyze tone of a message before sending
  app.post("/api/tone-check", requireAuth, async (req, res) => {
    try {
      const validated = toneCheckRequestSchema.parse(req.body);
      const result = await analyzeTone(validated.content);
      res.json(result);
    } catch (error) {
      console.error("[Tone] Route error:", error);
      res.status(400).json({ error: "Invalid request" });
    }
  });
}
