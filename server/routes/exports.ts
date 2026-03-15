import { type Express } from "express";
import { put } from "@vercel/blob";
import { db } from "../db";
import { messages, expenses, events, exportAuditLog, users, families } from "../tables";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { requireAuth } from "../auth";
import { createExportSchema } from "../../shared/schema";
import {
  generateMessageExportPdf,
  generateExpenseReportPdf,
  generateCalendarSummaryPdf,
  type MessageRecord,
  type ExpenseRecord,
  type CalendarRecord,
} from "../services/pdfGenerator";

// ============================================================
// Phase 2: PDF Export Routes
// ============================================================
// POST /api/exports/messages  — Generate message export PDF
// POST /api/exports/expenses  — Generate expense report PDF
// POST /api/exports/calendar  — Generate calendar summary PDF
// GET  /api/exports/history   — List past exports for family
// ============================================================

const MAX_EXPORT_RECORDS = 5000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function lookupUserName(userId: string): Promise<string> {
  const [user] = await db
    .select({ display_name: users.display_name, username: users.username })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) return "Unknown";
  return user.display_name || user.username;
}

async function lookupFamilyName(familyId: string): Promise<string> {
  const [family] = await db
    .select({ name: families.name })
    .from(families)
    .where(eq(families.id, familyId));

  return family?.name || "Unknown Family";
}

function buildDateRangeLabel(start: string, end: string): string {
  return `${start} to ${end}`;
}

function generateAuthCode(documentHash: string): string {
  return "CP-" + documentHash.slice(0, 8).toUpperCase();
}

async function uploadToBlob(
  filename: string,
  buffer: Buffer,
): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("[Exports] BLOB_READ_WRITE_TOKEN not set — returning data URI");
    return `data:application/pdf;filename=${filename};base64,${buffer.toString("base64").slice(0, 100)}...`;
  }
  const { url } = await put(`exports/${filename}`, buffer, {
    access: "public",
    contentType: "application/pdf",
  });
  return url;
}

async function logExport(
  familyId: string,
  userId: string,
  exportType: string,
  dateRangeStart: string,
  dateRangeEnd: string,
  recordCount: number,
  documentHash: string,
  authCode: string,
  filePath: string,
): Promise<void> {
  await db.insert(exportAuditLog).values({
    family_id: familyId,
    user_id: userId,
    export_type: exportType,
    date_range_start: dateRangeStart,
    date_range_end: dateRangeEnd,
    record_count: recordCount,
    document_hash: documentHash,
    file_path: filePath,
  });
}

// ---------------------------------------------------------------------------
// Route Registration
// ---------------------------------------------------------------------------

export function registerExportRoutes(app: Express): void {
  // -------------------------------------------------------------------
  // POST /api/exports/messages
  // -------------------------------------------------------------------
  app.post("/api/exports/messages", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;

      if (!familyId) {
        return res.status(400).json({ error: "No family associated with user" });
      }

      const validated = createExportSchema.parse({
        ...req.body,
        export_type: "messages",
      });

      const startDate = validated.date_range_start;
      const endDate = validated.date_range_end;

      const messageRows = await db
        .select({
          id: messages.id,
          sender_id: messages.sender_id,
          content: messages.content,
          content_hash: messages.content_hash,
          is_read: messages.is_read,
          read_at: messages.read_at,
          created_at: messages.created_at,
        })
        .from(messages)
        .where(
          and(
            eq(messages.family_id, familyId),
            gte(messages.created_at, startDate),
            lte(messages.created_at, endDate),
          ),
        )
        .orderBy(messages.created_at)
        .limit(MAX_EXPORT_RECORDS);

      if (messageRows.length === 0) {
        return res.status(404).json({ error: "No messages found in date range" });
      }

      const senderIds = [...new Set(messageRows.map((m) => m.sender_id))];
      const senderNameMap = new Map<string, string>();
      for (const senderId of senderIds) {
        senderNameMap.set(senderId, await lookupUserName(senderId));
      }

      const records: MessageRecord[] = messageRows.map((row) => ({
        id: row.id,
        sender_name: senderNameMap.get(row.sender_id) || "Unknown",
        content: row.content,
        content_hash: row.content_hash,
        is_read: row.is_read,
        read_at: row.read_at,
        created_at: row.created_at,
      }));

      const familyName = await lookupFamilyName(familyId);
      const dateRange = buildDateRangeLabel(startDate, endDate);

      const { buffer, documentHash } = await generateMessageExportPdf(
        records,
        familyName,
        dateRange,
        generateAuthCode(documentHash),
      );

      const timestamp = Date.now();
      const filename = `messages-${familyId}-${timestamp}.pdf`;
      const fileUrl = await uploadToBlob(filename, buffer);

      await logExport(
        familyId,
        userId,
        "messages",
        startDate,
        endDate,
        records.length,
        documentHash,
        generateAuthCode(documentHash),
        fileUrl,
      );

      res.json({
        url: fileUrl,
        record_count: records.length,
        document_hash: documentHash,
        authentication_code: generateAuthCode(documentHash),
        export_type: "messages",
        date_range: { start: startDate, end: endDate },
      });
    } catch (error) {
      console.error("[Exports] Message export error:", error);
      res.status(400).json({ error: "Failed to generate message export" });
    }
  });

  // -------------------------------------------------------------------
  // POST /api/exports/expenses
  // -------------------------------------------------------------------
  app.post("/api/exports/expenses", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;

      if (!familyId) {
        return res.status(400).json({ error: "No family associated with user" });
      }

      const validated = createExportSchema.parse({
        ...req.body,
        export_type: "expenses",
      });

      const startDate = validated.date_range_start;
      const endDate = validated.date_range_end;

      const expenseRows = await db
        .select({
          id: expenses.id,
          title: expenses.title,
          amount: expenses.amount,
          category: expenses.category,
          paid_by: expenses.paid_by,
          split_percentage: expenses.split_percentage,
          status: expenses.status,
          date: expenses.date,
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.family_id, familyId),
            gte(expenses.date, startDate),
            lte(expenses.date, endDate),
          ),
        )
        .orderBy(expenses.date)
        .limit(MAX_EXPORT_RECORDS);

      if (expenseRows.length === 0) {
        return res.status(404).json({ error: "No expenses found in date range" });
      }

      const payerIds = [...new Set(expenseRows.map((e) => e.paid_by))];
      const payerNameMap = new Map<string, string>();
      for (const payerId of payerIds) {
        payerNameMap.set(payerId, await lookupUserName(payerId));
      }

      const records: ExpenseRecord[] = expenseRows.map((row) => ({
        id: row.id,
        title: row.title,
        amount: row.amount,
        category: row.category,
        paid_by_name: payerNameMap.get(row.paid_by) || "Unknown",
        split_percentage: row.split_percentage,
        status: row.status,
        date: row.date,
      }));

      const familyName = await lookupFamilyName(familyId);
      const dateRange = buildDateRangeLabel(startDate, endDate);

      const { buffer, documentHash } = await generateExpenseReportPdf(
        records,
        familyName,
        dateRange,
        generateAuthCode(documentHash),
      );

      const timestamp = Date.now();
      const filename = `expenses-${familyId}-${timestamp}.pdf`;
      const fileUrl = await uploadToBlob(filename, buffer);

      await logExport(
        familyId,
        userId,
        "expenses",
        startDate,
        endDate,
        records.length,
        documentHash,
        generateAuthCode(documentHash),
        fileUrl,
      );

      res.json({
        url: fileUrl,
        record_count: records.length,
        document_hash: documentHash,
        authentication_code: generateAuthCode(documentHash),
        export_type: "expenses",
        date_range: { start: startDate, end: endDate },
      });
    } catch (error) {
      console.error("[Exports] Expense export error:", error);
      res.status(400).json({ error: "Failed to generate expense export" });
    }
  });

  // -------------------------------------------------------------------
  // POST /api/exports/calendar
  // -------------------------------------------------------------------
  app.post("/api/exports/calendar", requireAuth, async (req, res) => {
    try {
      const userId: string = (req as any).userId;
      const familyId: string = (req as any).familyId;

      if (!familyId) {
        return res.status(400).json({ error: "No family associated with user" });
      }

      const validated = createExportSchema.parse({
        ...req.body,
        export_type: "calendar",
      });

      const startDate = validated.date_range_start;
      const endDate = validated.date_range_end;

      const eventRows = await db
        .select({
          id: events.id,
          title: events.title,
          start_date: events.start_date,
          end_date: events.end_date,
          type: events.type,
          parent: events.parent,
          location: events.location,
          description: events.description,
        })
        .from(events)
        .where(
          and(
            eq(events.family_id, familyId),
            gte(events.start_date, startDate),
            lte(events.start_date, endDate),
          ),
        )
        .orderBy(events.start_date)
        .limit(MAX_EXPORT_RECORDS);

      if (eventRows.length === 0) {
        return res.status(404).json({ error: "No events found in date range" });
      }

      const records: CalendarRecord[] = eventRows.map((row) => ({
        id: row.id,
        title: row.title,
        start_date: row.start_date,
        end_date: row.end_date,
        type: row.type,
        parent: row.parent,
        location: row.location,
        description: row.description,
      }));

      const familyName = await lookupFamilyName(familyId);
      const dateRange = buildDateRangeLabel(startDate, endDate);

      const { buffer, documentHash } = await generateCalendarSummaryPdf(
        records,
        familyName,
        dateRange,
        generateAuthCode(documentHash),
      );

      const timestamp = Date.now();
      const filename = `calendar-${familyId}-${timestamp}.pdf`;
      const fileUrl = await uploadToBlob(filename, buffer);

      await logExport(
        familyId,
        userId,
        "calendar",
        startDate,
        endDate,
        records.length,
        documentHash,
        generateAuthCode(documentHash),
        fileUrl,
      );

      res.json({
        url: fileUrl,
        record_count: records.length,
        document_hash: documentHash,
        authentication_code: generateAuthCode(documentHash),
        export_type: "calendar",
        date_range: { start: startDate, end: endDate },
      });
    } catch (error) {
      console.error("[Exports] Calendar export error:", error);
      res.status(400).json({ error: "Failed to generate calendar export" });
    }
  });

  // -------------------------------------------------------------------
  // GET /api/exports/history
  // -------------------------------------------------------------------
  app.get("/api/exports/history", requireAuth, async (req, res) => {
    try {
      const familyId: string = (req as any).familyId;

      if (!familyId) {
        return res.status(400).json({ error: "No family associated with user" });
      }

      const history = await db
        .select()
        .from(exportAuditLog)
        .where(eq(exportAuditLog.family_id, familyId))
        .orderBy(desc(exportAuditLog.created_at));

      res.json(history);
    } catch (error) {
      console.error("[Exports] History fetch error:", error);
      res.status(500).json({ error: "Failed to fetch export history" });
    }
  });
}
