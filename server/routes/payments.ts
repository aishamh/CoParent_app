import { type Express } from "express";
import { db } from "../db";
import { users } from "../tables";
import { eq } from "drizzle-orm";
import { requireAuth } from "../auth";
import { updatePaymentInfoSchema } from "../../shared/schema";

export function registerPaymentRoutes(app: Express): void {
  // ----------------------------------------------------------
  // PATCH /api/users/payment-info -- Update own payment info
  // ----------------------------------------------------------
  app.patch("/api/users/payment-info", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const validated = updatePaymentInfoSchema.parse(req.body);

      const [updated] = await db
        .update(users)
        .set({
          venmo_username: validated.venmo_username ?? undefined,
          paypal_email: validated.paypal_email ?? undefined,
        })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          venmo_username: users.venmo_username,
          paypal_email: users.paypal_email,
        });

      if (!updated) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("[Payments] Update payment info error:", error);
      res.status(400).json({ error: "Invalid payment data" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/users/:id/payment-info -- Get another user's info
  // ----------------------------------------------------------
  app.get("/api/users/:id/payment-info", requireAuth, async (req, res) => {
    try {
      const requestingFamilyId: string = (req as any).familyId;
      const targetUserId = req.params.id;

      const [targetUser] = await db
        .select({
          id: users.id,
          family_id: users.family_id,
          venmo_username: users.venmo_username,
          paypal_email: users.paypal_email,
        })
        .from(users)
        .where(eq(users.id, targetUserId));

      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Only allow viewing payment info for users in the same family
      if (targetUser.family_id !== requestingFamilyId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json({
        id: targetUser.id,
        venmo_username: targetUser.venmo_username,
        paypal_email: targetUser.paypal_email,
      });
    } catch (error) {
      console.error("[Payments] Get payment info error:", error);
      res.status(500).json({ error: "Failed to fetch payment info" });
    }
  });
}
