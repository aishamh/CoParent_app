import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { User } from '../shared/schema';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { db } from './db';
import { refreshTokens } from './tables';
import { eq, and, isNull } from 'drizzle-orm';

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_DAYS = 30;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function sanitizeUser(user: User): Omit<User, 'password' | 'apple_user_identifier'> {
  const { password, apple_user_identifier, ...safe } = user;
  return safe;
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Refresh token management
// ---------------------------------------------------------------------------

function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure refresh token, store its hash in DB,
 * and return the raw token (sent to client, never stored server-side).
 */
export async function generateRefreshToken(
  userId: string,
  deviceInfo?: string,
  familyId?: string,
): Promise<{ refreshToken: string; familyId: string }> {
  const rawToken = crypto.randomBytes(64).toString('base64url');
  const tokenHash = hashRefreshToken(rawToken);
  const family = familyId ?? crypto.randomUUID();

  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  await db.insert(refreshTokens).values({
    user_id: userId,
    token_hash: tokenHash,
    family_id: family,
    device_info: deviceInfo ?? null,
    expires_at: expiresAt,
  });

  return { refreshToken: rawToken, familyId: family };
}

/**
 * Rotate a refresh token: verify the old one, issue a new one in the same
 * family, and mark the old one as replaced. If the old token has already been
 * used (replay attack), revoke the entire family.
 */
export async function rotateRefreshToken(
  oldToken: string,
  deviceInfo?: string,
): Promise<{
  accessToken: string;
  refreshToken: string;
  userId: string;
} | null> {
  const tokenHash = hashRefreshToken(oldToken);

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token_hash, tokenHash))
    .limit(1);

  if (!existing) return null;

  // Already revoked or replaced → replay attack → revoke entire family
  if (existing.revoked_at || existing.replaced_by) {
    await revokeRefreshTokenFamily(existing.family_id);
    return null;
  }

  // Expired
  if (new Date(existing.expires_at) < new Date()) {
    await db
      .update(refreshTokens)
      .set({ revoked_at: new Date().toISOString() })
      .where(eq(refreshTokens.id, existing.id));
    return null;
  }

  // Issue new tokens
  const accessToken = generateToken(existing.user_id);
  const { refreshToken: newRefreshToken } = await generateRefreshToken(
    existing.user_id,
    deviceInfo,
    existing.family_id,
  );

  // Mark old token as replaced
  const newTokenHash = hashRefreshToken(newRefreshToken);
  await db
    .update(refreshTokens)
    .set({
      replaced_by: newTokenHash,
      revoked_at: new Date().toISOString(),
    })
    .where(eq(refreshTokens.id, existing.id));

  return {
    accessToken,
    refreshToken: newRefreshToken,
    userId: existing.user_id,
  };
}

/** Revoke all tokens in a family chain (used on logout or replay detection). */
export async function revokeRefreshTokenFamily(familyId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revoked_at: new Date().toISOString() })
    .where(
      and(
        eq(refreshTokens.family_id, familyId),
        isNull(refreshTokens.revoked_at),
      ),
    );
}

/** Revoke all refresh tokens for a user (e.g., password change). */
export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await db
    .update(refreshTokens)
    .set({ revoked_at: new Date().toISOString() })
    .where(
      and(
        eq(refreshTokens.user_id, userId),
        isNull(refreshTokens.revoked_at),
      ),
    );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return req.cookies?.token || null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  (req as any).userId = payload.userId;

  const user = await storage.getUser(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  (req as any).familyId = user.family_id;
  next();
}
