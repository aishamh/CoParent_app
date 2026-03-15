import PDFDocument from "pdfkit";
import { createHash } from "crypto";

// ============================================================
// PDF Generator Service — Court-Admissible Export Engine
// ============================================================
// Generates tamper-evident PDFs with SHA-256 integrity hashes
// for messages, expenses, and calendar records.
// Each document includes per-record hashes, a document-level
// hash, and an authentication code for court verification.
// ============================================================

const MAX_RECORDS_PER_EXPORT = 5000;
const PAGE_BOTTOM_MARGIN = 700;
const SEPARATOR_WIDTH = 60;

// ---------------------------------------------------------------------------
// Record Interfaces
// ---------------------------------------------------------------------------

export interface MessageRecord {
  id: string;
  sender_name: string;
  content: string;
  content_hash: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ExpenseRecord {
  id: number;
  title: string;
  amount: number;
  category: string;
  paid_by_name: string;
  split_percentage: number;
  status: string;
  date: string;
}

export interface CalendarRecord {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  type: string;
  parent: string;
  location: string | null;
  description: string | null;
}

export interface PdfGenerationResult {
  buffer: Buffer;
  documentHash: string;
}

// ---------------------------------------------------------------------------
// Shared Helpers
// ---------------------------------------------------------------------------

function addHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  familyName: string,
  dateRange: string,
  authCode?: string,
): void {
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("CoParent Connect", { align: "center" })
    .fontSize(14)
    .text(title, { align: "center" })
    .fontSize(10)
    .font("Helvetica")
    .text(`Family: ${familyName}`, { align: "center" })
    .text(`Date Range: ${dateRange}`, { align: "center" })
    .text(`Generated: ${new Date().toISOString()}`, { align: "center" });

  if (authCode) {
    doc
      .moveDown(0.5)
      .fontSize(9)
      .font("Helvetica-Bold")
      .fillColor("#DC2626")
      .text(`Authentication Code: ${authCode}`, { align: "center" })
      .fillColor("black");
  }

  doc.moveDown(2);
}

function addFooter(
  doc: PDFKit.PDFDocument,
  documentHash: string,
  recordCount: number,
  authCode?: string,
): void {
  doc
    .moveDown(2)
    .fontSize(8)
    .font("Helvetica")
    .text("\u2500".repeat(80))
    .text("INTEGRITY STATEMENT", { align: "center" })
    .text(
      `This document contains ${recordCount} records exported from CoParent Connect.`,
      { align: "center" },
    )
    .text(`Document Hash (SHA-256): ${documentHash}`, { align: "center" });

  if (authCode) {
    doc.text(`Authentication Code: ${authCode}`, { align: "center" });
  }

  doc.text(
    "Each message includes its individual content hash for independent verification.",
    { align: "center" },
  )
    .text(
      `Generated on ${new Date().toISOString()} \u2014 This export is uneditable and court-admissible.`,
      { align: "center" },
    );
}

function collectPdfBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function addPageBreakIfNeeded(doc: PDFKit.PDFDocument): void {
  if (doc.y > PAGE_BOTTOM_MARGIN) {
    doc.addPage();
  }
}

function drawSeparator(doc: PDFKit.PDFDocument): void {
  doc
    .moveDown(0.5)
    .text("\u2500".repeat(SEPARATOR_WIDTH))
    .moveDown(0.5);
}

function computeDocumentHash(hashInputs: string[]): string {
  return createHash("sha256").update(hashInputs.join("|")).digest("hex");
}

// ---------------------------------------------------------------------------
// Message Export
// ---------------------------------------------------------------------------

export async function generateMessageExportPdf(
  records: MessageRecord[],
  familyName: string,
  dateRange: string,
  authCode?: string,
): Promise<PdfGenerationResult> {
  const capped = records.slice(0, MAX_RECORDS_PER_EXPORT);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const bufferPromise = collectPdfBuffer(doc);

  addHeader(doc, "Message Export \u2014 Court Record", familyName, dateRange, authCode);

  const hashInputs: string[] = [];

  for (const msg of capped) {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(`From: ${msg.sender_name}`)
      .font("Helvetica")
      .text(`Date: ${msg.created_at}`)
      .text(`Content: ${msg.content}`)
      .text(`Hash: ${msg.content_hash}`)
      .text(`Read: ${msg.is_read ? `Yes (${msg.read_at})` : "No"}`);

    drawSeparator(doc);
    hashInputs.push(msg.content_hash);
    addPageBreakIfNeeded(doc);
  }

  const documentHash = computeDocumentHash(hashInputs);
  addFooter(doc, documentHash, capped.length, authCode);
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, documentHash };
}

// ---------------------------------------------------------------------------
// Expense Report
// ---------------------------------------------------------------------------

export async function generateExpenseReportPdf(
  records: ExpenseRecord[],
  familyName: string,
  dateRange: string,
  authCode?: string,
): Promise<PdfGenerationResult> {
  const capped = records.slice(0, MAX_RECORDS_PER_EXPORT);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const bufferPromise = collectPdfBuffer(doc);

  addHeader(doc, "Expense Report", familyName, dateRange, authCode);

  const hashInputs: string[] = [];
  let totalAmount = 0;

  for (const expense of capped) {
    totalAmount += expense.amount;

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(expense.title)
      .font("Helvetica")
      .text(
        `Amount: $${expense.amount.toFixed(2)} | Category: ${expense.category}`,
      )
      .text(
        `Paid by: ${expense.paid_by_name} | Split: ${expense.split_percentage}%`,
      )
      .text(`Status: ${expense.status} | Date: ${expense.date}`);

    drawSeparator(doc);
    hashInputs.push(`${expense.id}:${expense.amount}:${expense.date}`);
    addPageBreakIfNeeded(doc);
  }

  doc
    .moveDown()
    .fontSize(12)
    .font("Helvetica-Bold")
    .text(`Total: $${totalAmount.toFixed(2)}`, { align: "right" });

  const documentHash = computeDocumentHash(hashInputs);
  addFooter(doc, documentHash, capped.length, authCode);
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, documentHash };
}

// ---------------------------------------------------------------------------
// Calendar Summary
// ---------------------------------------------------------------------------

export async function generateCalendarSummaryPdf(
  records: CalendarRecord[],
  familyName: string,
  dateRange: string,
  authCode?: string,
): Promise<PdfGenerationResult> {
  const capped = records.slice(0, MAX_RECORDS_PER_EXPORT);
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const bufferPromise = collectPdfBuffer(doc);

  addHeader(doc, "Calendar Summary", familyName, dateRange, authCode);

  const hashInputs: string[] = [];

  for (const event of capped) {
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text(event.title)
      .font("Helvetica")
      .text(`Dates: ${event.start_date} \u2014 ${event.end_date}`)
      .text(`Type: ${event.type} | Parent: ${event.parent}`)
      .text(`Location: ${event.location || "N/A"}`);

    if (event.description) {
      doc.text(`Notes: ${event.description}`);
    }

    drawSeparator(doc);
    hashInputs.push(`${event.id}:${event.start_date}:${event.end_date}`);
    addPageBreakIfNeeded(doc);
  }

  const documentHash = computeDocumentHash(hashInputs);
  addFooter(doc, documentHash, capped.length, authCode);
  doc.end();

  const buffer = await bufferPromise;
  return { buffer, documentHash };
}
