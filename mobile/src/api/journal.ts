import { fetchApi } from "./client";
import type {
  JournalEntry,
  InsertJournalEntry,
  UpdateJournalEntry,
} from "../types/schema";

export async function getJournalEntries(): Promise<JournalEntry[]> {
  try {
    return await fetchApi<JournalEntry[]>("/api/journal");
  } catch {
    return [];
  }
}

export async function createJournalEntry(
  data: InsertJournalEntry,
): Promise<JournalEntry | null> {
  try {
    return await fetchApi<JournalEntry>("/api/journal", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function updateJournalEntry(
  id: number,
  data: UpdateJournalEntry,
): Promise<JournalEntry | null> {
  try {
    return await fetchApi<JournalEntry>(`/api/journal/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteJournalEntry(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/journal/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}
