import type { Express } from "express";
import jwt from "jsonwebtoken";
import { requireAuth } from "../auth";
import { storage } from "../storage";
import type { Event } from "../../shared/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is required");
  return secret;
}

const CALENDAR_TOKEN_EXPIRY = "365d";

function generateCalendarToken(familyId: string): string {
  return jwt.sign(
    { familyId, purpose: "calendar" },
    getJwtSecret(),
    { expiresIn: CALENDAR_TOKEN_EXPIRY },
  );
}

function verifyCalendarToken(
  token: string,
): { familyId: string; purpose: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      familyId: string;
      purpose: string;
    };
    if (decoded.purpose !== "calendar") return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Build an ICS string from an array of events. */
function buildIcsContent(events: Event[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CoParent//Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:CoParent Family Calendar",
  ];

  for (const ev of events) {
    const startDateClean = ev.start_date.replace(/-/g, "");
    const endDateClean = ev.end_date.replace(/-/g, "");
    const startTimeClean = (ev.start_time || "0000").replace(":", "");
    const endTimeClean = (ev.end_time || "2359").replace(":", "");

    lines.push("BEGIN:VEVENT");
    lines.push(`DTSTART:${startDateClean}T${startTimeClean}00`);
    lines.push(`DTEND:${endDateClean}T${endTimeClean}00`);
    lines.push(`SUMMARY:${escapeIcsText(ev.title)}`);
    if (ev.description)
      lines.push(`DESCRIPTION:${escapeIcsText(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${escapeIcsText(ev.location)}`);
    lines.push(`UID:event-${ev.id}@coparent`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/** Escape special characters for iCalendar text values. */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerCalendarExportRoutes(app: Express): void {
  /**
   * POST /api/calendar/subscribe-token
   * Generate a long-lived JWT for iCal subscription.
   * Returns { url: string } containing the full subscribe URL.
   */
  app.post("/api/calendar/subscribe-token", requireAuth, (req, res) => {
    const familyId: string = (req as any).familyId;

    const token = generateCalendarToken(familyId);

    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = `${protocol}://${host}/api/calendar/ical/${familyId}.ics?token=${token}`;

    res.json({ url });
  });

  /**
   * GET /api/calendar/ical/:familyId.ics?token=<jwt>
   * Public endpoint (no requireAuth) — authenticated via the signed JWT token.
   * Returns text/calendar content for subscription by Apple Calendar, Google Calendar, etc.
   */
  app.get("/api/calendar/ical/:familyId.ics", async (req, res) => {
    const { token } = req.query;
    const { familyId } = req.params;

    if (!token || typeof token !== "string") {
      res.status(401).json({ error: "Missing token" });
      return;
    }

    const decoded = verifyCalendarToken(token);
    if (!decoded || decoded.familyId !== familyId) {
      res.status(403).json({ error: "Invalid or expired token" });
      return;
    }

    try {
      const { data: events } = await storage.getEvents(familyId);
      const icsContent = buildIcsContent(events);

      res.setHeader("Content-Type", "text/calendar; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="coparent-calendar.ics"`,
      );
      res.send(icsContent);
    } catch {
      res.status(500).json({ error: "Failed to generate calendar" });
    }
  });
}
