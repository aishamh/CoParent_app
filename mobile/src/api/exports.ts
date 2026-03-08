import { fetchApi } from "./client";
import type { ExportAuditLog } from "../types/schema";

interface ExportResult {
  url: string;
  record_count: number;
  document_hash: string;
}

export async function exportMessages(
  startDate: string,
  endDate: string,
): Promise<ExportResult | null> {
  try {
    return await fetchApi<ExportResult>("/api/exports/messages", {
      method: "POST",
      body: JSON.stringify({
        date_range_start: startDate,
        date_range_end: endDate,
      }),
    });
  } catch {
    return null;
  }
}

export async function exportExpenses(
  startDate: string,
  endDate: string,
): Promise<ExportResult | null> {
  try {
    return await fetchApi<ExportResult>("/api/exports/expenses", {
      method: "POST",
      body: JSON.stringify({
        date_range_start: startDate,
        date_range_end: endDate,
      }),
    });
  } catch {
    return null;
  }
}

export async function exportCalendar(
  startDate: string,
  endDate: string,
): Promise<ExportResult | null> {
  try {
    return await fetchApi<ExportResult>("/api/exports/calendar", {
      method: "POST",
      body: JSON.stringify({
        date_range_start: startDate,
        date_range_end: endDate,
      }),
    });
  } catch {
    return null;
  }
}

export async function getExportHistory(): Promise<ExportAuditLog[]> {
  try {
    return await fetchApi<ExportAuditLog[]>("/api/exports/history");
  } catch {
    return [];
  }
}
