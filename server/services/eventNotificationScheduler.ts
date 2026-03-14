import { db } from "../db";
import { eventNotifications, deviceTokens, communityEvents, notificationPreferences } from "../tables";
import { eq, and, lte, gte } from "drizzle-orm";

// ============================================================
// Notification Types
// ============================================================

interface NotificationPayload {
  title: string;
  body: string;
  eventId: string;
  type: "7_days" | "3_days" | "1_day" | "same_day" | "interest_match";
}

// ============================================================
// Notification Formatter
// ============================================================

function formatNotificationMessage(
  type: string,
  event: any,
): { title: string; body: string } {
  const eventName = event.title || "Event";
  const eventDate = new Date(event.event_date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const eventTime = event.event_time ? ` at ${formatTime(event.event_time)}` : "";

  switch (type) {
    case "7_days":
      return {
        title: "Upcoming Event Next Week",
        body: `"${eventName}" is on ${eventDate}${eventTime}`,
      };
    case "3_days":
      return {
        title: "Event in 3 Days",
        body: `"${eventName}" on ${eventDate}${eventTime}`,
      };
    case "1_day":
      return {
        title: "Event Tomorrow",
        body: `"${eventName}" starts tomorrow${eventTime}`,
      };
    case "same_day":
      return {
        title: "Event Today",
        body: `"${eventName}" starts today${eventTime}`,
      };
    case "interest_match":
      return {
        title: "New Event Based on Your Interests",
        body: `"${eventName}" matches your interests!`,
      };
    default:
      return {
        title: "Event Reminder",
        body: `"${eventName}" coming up soon`,
      };
  }
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Send push notification to a user's device tokens.
 * In production, this would use APNs (Apple Push Notification Service)
 * or FCM (Firebase Cloud Messaging).
 */
async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
): Promise<void> {
  // Get user's active device tokens
  const tokens = await db
    .select()
    .from(deviceTokens)
    .where(and(eq(deviceTokens.user_id, userId), eq(deviceTokens.is_active, true)));

  if (tokens.length === 0) {
    console.log(`[EventNotifications] No active tokens for user ${userId}`);
    return;
  }

  // Check user's notification preferences
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.user_id, userId));

  if (!prefs || !prefs.community_events_enabled) {
    console.log(`[EventNotifications] Community events disabled for user ${userId}`);
    return;
  }

  // TODO: Integrate with actual APNs/FCM service
  // For now, log the notification
  console.log(`[EventNotifications] Would send to ${tokens.length} device(s):`, {
    userId,
    title: payload.title,
    body: payload.body,
    eventId: payload.eventId,
  });

  // Production code would look like:
  // for (const token of tokens) {
  //   await apnsProvider.send(token, {
  //     aps: {
  //       alert: { title: payload.title, body: payload.body },
  //       sound: "default",
  //       badge: 1,
  //     },
  //     eventId: payload.eventId,
  //     type: payload.type,
  //   });
  // }
}

/**
 * Process pending event notifications that are due.
 * This should be called periodically (e.g., every 5 minutes) via a cron job.
 */
export async function processPendingNotifications(): Promise<number> {
  const now = new Date().toISOString();

  // Find pending notifications that are due
  const pending = await db
    .select()
    .from(eventNotifications)
    .where(
      and(
        eq(eventNotifications.status, "pending"),
        lte(eventNotifications.scheduled_at, now),
      ),
    );

  if (pending.length === 0) {
    return 0;
  }

  console.log(`[EventNotifications] Processing ${pending.length} pending notifications`);

  let sentCount = 0;

  for (const notification of pending) {
    try {
      // Get event details
      const [event] = await db
        .select()
        .from(communityEvents)
        .where(eq(communityEvents.id, notification.event_id));

      if (!event) {
        // Mark as cancelled if event no longer exists
        await db
          .update(eventNotifications)
          .set({ status: "cancelled" })
          .where(eq(eventNotifications.id, notification.id));
        continue;
      }

      // Format and send notification
      const { title, body } = formatNotificationMessage(
        notification.notification_type,
        event,
      );

      await sendPushNotification(notification.user_id, {
        title,
        body,
        eventId: notification.event_id,
        type: notification.notification_type as any,
      });

      // Mark as sent
      await db
        .update(eventNotifications)
        .set({
          status: "sent",
          sent_at: new Date().toISOString(),
        })
        .where(eq(eventNotifications.id, notification.id));

      sentCount++;
    } catch (error) {
      console.error(
        `[EventNotifications] Failed to process notification ${notification.id}:`,
        error,
      );
    }
  }

  console.log(`[EventNotifications] Sent ${sentCount} of ${pending.length} notifications`);
  return sentCount;
}

/**
 * Schedule "interest match" notifications for new events.
 * Call this when new community events are discovered or created.
 */
export async function scheduleInterestMatchNotifications(
  eventId: string,
  tags: string[],
): Promise<void> {
  if (!tags || tags.length === 0) {
    return;
  }

  // Get all users who have children with matching interests
  // This is a simplified approach - in production, you'd want a more efficient query
  // using a separate child_interests table for faster matching
  console.log(`[EventNotifications] Interest matching not yet implemented for event ${eventId}`);
  // TODO: Implement interest matching logic
}

/**
 * Clean up old sent notifications (older than 30 days).
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const result = await db
    .delete(eventNotifications)
    .where(
      and(
        eq(eventNotifications.status, "sent"),
        lte(eventNotifications.created_at, thirtyDaysAgo.toISOString()),
      ),
    )
    .returning();

  console.log(`[EventNotifications] Cleaned up ${result.length} old notifications`);
  return result.length;
}

/**
 * Get notification stats for monitoring.
 */
export async function getNotificationStats(): Promise<{
  pending: number;
  sentToday: number;
  sentThisWeek: number;
  cancelled: number;
}> {
  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [pending, sentToday, sentThisWeek, cancelled] = await Promise.all([
    db
      .select({ total: count() })
      .from(eventNotifications)
      .where(eq(eventNotifications.status, "pending")),
    db
      .select({ total: count() })
      .from(eventNotifications)
      .where(
        and(
          eq(eventNotifications.status, "sent"),
          gte(eventNotifications.sent_at, today),
        ),
      ),
    db
      .select({ total: count() })
      .from(eventNotifications)
      .where(
        and(
          eq(eventNotifications.status, "sent"),
          gte(eventNotifications.sent_at, weekAgo.toISOString()),
        ),
      ),
    db
      .select({ total: count() })
      .from(eventNotifications)
      .where(eq(eventNotifications.status, "cancelled")),
  ]);

  return {
    pending: pending[0]?.total || 0,
    sentToday: sentToday[0]?.total || 0,
    sentThisWeek: sentThisWeek[0]?.total || 0,
    cancelled: cancelled[0]?.total || 0,
  };
}

// Import count function
const { count } = require("drizzle-orm");
