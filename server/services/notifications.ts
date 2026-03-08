import { db } from "../db";
import { deviceTokens, notificationPreferences } from "../tables";
import { eq, and } from "drizzle-orm";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Send push notification to a specific user.
 * Checks user's notification preferences before sending.
 * Gracefully degrades to console.log when APNs credentials are missing.
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload,
  category?: string
): Promise<void> {
  // Check notification preferences
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.user_id, userId));

  if (prefs) {
    // Check if the category is enabled
    if (category === "messages" && !prefs.messages_enabled) return;
    if (category === "calendar" && !prefs.calendar_enabled) return;
    if (category === "expenses" && !prefs.expenses_enabled) return;
    if (category === "custody" && !prefs.custody_reminders_enabled) return;
  }

  // Get active device tokens
  const tokens = await db
    .select()
    .from(deviceTokens)
    .where(
      and(
        eq(deviceTokens.user_id, userId),
        eq(deviceTokens.is_active, true)
      )
    );

  if (tokens.length === 0) return;

  // Check if APNs is configured
  const apnsKeyId = process.env.APNS_KEY_ID;
  const apnsTeamId = process.env.APNS_TEAM_ID;
  const apnsKey = process.env.APNS_KEY; // .p8 key content
  const apnsBundleId = process.env.APNS_BUNDLE_ID;

  if (!apnsKeyId || !apnsTeamId || !apnsKey || !apnsBundleId) {
    // Development fallback: log the notification
    console.log(`[Push] Would send to ${userId}:`, payload);
    return;
  }

  // In production, send via APNs HTTP/2
  // For now, we use a simplified HTTP-based approach compatible with Vercel serverless
  // (The `apn` npm package requires HTTP/2 which doesn't work on all serverless platforms)
  // Instead we use the APNs REST API via fetch with JWT auth

  const jwt = await generateApnsJwt(apnsKeyId, apnsTeamId, apnsKey);
  const isProduction = process.env.NODE_ENV === "production";
  const apnsHost = isProduction
    ? "https://api.push.apple.com"
    : "https://api.sandbox.push.apple.com";

  for (const tokenRecord of tokens) {
    try {
      const response = await fetch(
        `${apnsHost}/3/device/${tokenRecord.token}`,
        {
          method: "POST",
          headers: {
            authorization: `bearer ${jwt}`,
            "apns-topic": apnsBundleId,
            "apns-push-type": "alert",
            "apns-priority": "10",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            aps: {
              alert: { title: payload.title, body: payload.body },
              sound: "default",
              badge: 1,
            },
            ...payload.data,
          }),
        }
      );

      if (response.status === 410 || response.status === 400) {
        // Token is no longer valid — deactivate it
        await db
          .update(deviceTokens)
          .set({ is_active: false })
          .where(eq(deviceTokens.id, tokenRecord.id));
      }
    } catch (error) {
      console.error(`[Push] Failed to send to token ${tokenRecord.id}:`, error);
    }
  }
}

/**
 * Generate a JWT for APNs authentication.
 * Uses ES256 algorithm with the .p8 key.
 */
async function generateApnsJwt(
  keyId: string,
  teamId: string,
  key: string
): Promise<string> {
  // Use jsonwebtoken for ES256 signing
  const jwt = await import("jsonwebtoken");
  const token = jwt.default.sign({}, key, {
    algorithm: "ES256",
    keyid: keyId,
    issuer: teamId,
    expiresIn: "1h",
  });
  return token;
}
