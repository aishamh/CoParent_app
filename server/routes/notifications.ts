import { type Express } from "express";
import { db } from "../db";
import { deviceTokens, notificationPreferences } from "../tables";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  insertDeviceTokenSchema,
  updateNotificationPreferencesSchema,
} from "../../shared/schema";

export function registerNotificationRoutes(app: Express): void {
  // Register device token
  app.post("/api/device-tokens", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const validated = insertDeviceTokenSchema.parse(req.body);

      // Upsert: deactivate old tokens with same value, insert new
      await db
        .update(deviceTokens)
        .set({ is_active: false })
        .where(eq(deviceTokens.token, validated.token));

      const [token] = await db
        .insert(deviceTokens)
        .values({
          user_id: userId,
          token: validated.token,
          platform: validated.platform,
          is_active: true,
        })
        .onConflictDoUpdate({
          target: deviceTokens.token,
          set: { user_id: userId, is_active: true, platform: validated.platform },
        })
        .returning();

      res.status(201).json(token);
    } catch (error) {
      console.error("[Notifications] Register token error:", error);
      res.status(400).json({ error: "Invalid device token data" });
    }
  });

  // Deactivate device token (on sign out)
  app.delete("/api/device-tokens", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }

      await db
        .update(deviceTokens)
        .set({ is_active: false })
        .where(
          and(
            eq(deviceTokens.user_id, userId),
            eq(deviceTokens.token, token)
          )
        );

      res.status(204).send();
    } catch (error) {
      console.error("[Notifications] Deactivate token error:", error);
      res.status(500).json({ error: "Failed to deactivate token" });
    }
  });

  // Get notification preferences (creates defaults if none exist)
  app.get("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;

      let [prefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.user_id, userId));

      if (!prefs) {
        [prefs] = await db
          .insert(notificationPreferences)
          .values({ user_id: userId })
          .returning();
      }

      res.json(prefs);
    } catch (error) {
      console.error("[Notifications] Get preferences error:", error);
      res.status(500).json({ error: "Failed to load preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/notification-preferences", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const validated = updateNotificationPreferencesSchema.parse(req.body);

      // Ensure preferences record exists
      const [existing] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.user_id, userId));

      if (!existing) {
        const [created] = await db
          .insert(notificationPreferences)
          .values({ user_id: userId, ...validated, updated_at: new Date().toISOString() })
          .returning();
        return res.json(created);
      }

      const [updated] = await db
        .update(notificationPreferences)
        .set({ ...validated, updated_at: new Date().toISOString() })
        .where(eq(notificationPreferences.user_id, userId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[Notifications] Update preferences error:", error);
      res.status(400).json({ error: "Invalid preferences data" });
    }
  });
}
