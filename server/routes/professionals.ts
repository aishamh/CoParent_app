import crypto from "crypto";
import { type Express } from "express";
import { db } from "../db";
import { professionalInvites, professionalAccess, users } from "../tables";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../auth";
import {
  createProfessionalInviteSchema,
  updateProfessionalAccessSchema,
} from "../../shared/schema";

// ============================================================
// Helpers
// ============================================================

const INVITE_EXPIRY_DAYS = 7;

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function expiresAt(): string {
  const date = new Date();
  date.setDate(date.getDate() + INVITE_EXPIRY_DAYS);
  return date.toISOString();
}

function isExpired(expiresAtIso: string): boolean {
  return new Date(expiresAtIso) < new Date();
}

// ============================================================
// Route Registration
// ============================================================

export function registerProfessionalRoutes(app: Express): void {
  // ----------------------------------------------------------
  // POST /api/professional-invites -- Create an invite code
  // ----------------------------------------------------------
  app.post("/api/professional-invites", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;

      if (!familyId) {
        return res.status(400).json({ error: "No family associated" });
      }

      const validated = createProfessionalInviteSchema.parse(req.body);

      const [invite] = await db
        .insert(professionalInvites)
        .values({
          family_id: familyId,
          invite_code: generateInviteCode(),
          role: validated.role,
          invited_by: userId,
          email: validated.email ?? null,
          expires_at: expiresAt(),
        })
        .returning();

      res.status(201).json(invite);
    } catch (error) {
      console.error("[Professionals] Create invite error:", error);
      res.status(400).json({ error: "Invalid invite data" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/professional-invites -- List invites for family
  // ----------------------------------------------------------
  app.get("/api/professional-invites", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      const invites = await db
        .select()
        .from(professionalInvites)
        .where(eq(professionalInvites.family_id, familyId))
        .orderBy(desc(professionalInvites.created_at));

      res.json(invites);
    } catch (error) {
      console.error("[Professionals] List invites error:", error);
      res.status(500).json({ error: "Failed to list invites" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/professional-invites/:id -- Revoke an invite
  // ----------------------------------------------------------
  app.delete("/api/professional-invites/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const inviteId = req.params.id;

      const [existing] = await db
        .select()
        .from(professionalInvites)
        .where(
          and(
            eq(professionalInvites.id, inviteId),
            eq(professionalInvites.family_id, familyId),
          ),
        );

      if (!existing) {
        return res.status(404).json({ error: "Invite not found" });
      }

      await db
        .update(professionalInvites)
        .set({ revoked: true })
        .where(eq(professionalInvites.id, inviteId));

      res.status(204).send();
    } catch (error) {
      console.error("[Professionals] Revoke invite error:", error);
      res.status(500).json({ error: "Failed to revoke invite" });
    }
  });

  // ----------------------------------------------------------
  // POST /api/professional-invites/accept -- Accept an invite
  // ----------------------------------------------------------
  app.post("/api/professional-invites/accept", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const { invite_code } = req.body;

      if (!invite_code || typeof invite_code !== "string") {
        return res.status(400).json({ error: "invite_code is required" });
      }

      const [invite] = await db
        .select()
        .from(professionalInvites)
        .where(eq(professionalInvites.invite_code, invite_code.toUpperCase()));

      if (!invite) {
        return res.status(404).json({ error: "Invalid invite code" });
      }

      if (invite.revoked) {
        return res.status(400).json({ error: "Invite has been revoked" });
      }

      if (isExpired(invite.expires_at)) {
        return res.status(400).json({ error: "Invite has expired" });
      }

      if (invite.accepted_by) {
        return res.status(400).json({ error: "Invite has already been accepted" });
      }

      // Create professional access record
      const [access] = await db
        .insert(professionalAccess)
        .values({
          family_id: invite.family_id,
          user_id: userId,
          role: invite.role,
          granted_by: invite.invited_by,
        })
        .returning();

      // Mark the invite as accepted
      await db
        .update(professionalInvites)
        .set({ accepted_by: userId })
        .where(eq(professionalInvites.id, invite.id));

      res.status(201).json(access);
    } catch (error) {
      console.error("[Professionals] Accept invite error:", error);
      res.status(400).json({ error: "Failed to accept invite" });
    }
  });

  // ----------------------------------------------------------
  // GET /api/family/professionals -- List active professionals
  // ----------------------------------------------------------
  app.get("/api/family/professionals", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      const records = await db
        .select({
          access: professionalAccess,
          user: {
            id: users.id,
            username: users.username,
            display_name: users.display_name,
            email: users.email,
            avatar_url: users.avatar_url,
          },
        })
        .from(professionalAccess)
        .innerJoin(users, eq(professionalAccess.user_id, users.id))
        .where(
          and(
            eq(professionalAccess.family_id, familyId),
            eq(professionalAccess.is_active, true),
          ),
        )
        .orderBy(desc(professionalAccess.created_at));

      res.json(records);
    } catch (error) {
      console.error("[Professionals] List professionals error:", error);
      res.status(500).json({ error: "Failed to list professionals" });
    }
  });

  // ----------------------------------------------------------
  // PATCH /api/professional-access/:id -- Update permissions
  // ----------------------------------------------------------
  app.patch("/api/professional-access/:id", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const accessId = req.params.id;

      const [existing] = await db
        .select()
        .from(professionalAccess)
        .where(eq(professionalAccess.id, accessId));

      if (!existing) {
        return res.status(404).json({ error: "Professional access not found" });
      }

      // Only the parent who granted access can modify permissions
      if (existing.granted_by !== userId) {
        return res.status(403).json({ error: "Only the granting parent can modify access" });
      }

      const validated = updateProfessionalAccessSchema.parse(req.body);

      const [updated] = await db
        .update(professionalAccess)
        .set(validated)
        .where(eq(professionalAccess.id, accessId))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("[Professionals] Update access error:", error);
      res.status(400).json({ error: "Invalid access data" });
    }
  });

  // ----------------------------------------------------------
  // DELETE /api/professional-access/:id -- Revoke access
  // ----------------------------------------------------------
  app.delete("/api/professional-access/:id", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;
      const accessId = req.params.id;

      const [existing] = await db
        .select()
        .from(professionalAccess)
        .where(
          and(
            eq(professionalAccess.id, accessId),
            eq(professionalAccess.family_id, familyId),
          ),
        );

      if (!existing) {
        return res.status(404).json({ error: "Professional access not found" });
      }

      await db
        .update(professionalAccess)
        .set({ is_active: false })
        .where(eq(professionalAccess.id, accessId));

      res.status(204).send();
    } catch (error) {
      console.error("[Professionals] Revoke access error:", error);
      res.status(500).json({ error: "Failed to revoke access" });
    }
  });
}
