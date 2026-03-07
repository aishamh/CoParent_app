import { fetchApi } from "./client";
import type {
  ReadingListItem,
  SchoolTask,
  HandoverNote,
} from "../types/schema";

// --- Reading List ---

export async function getReadingList(
  childId?: number,
): Promise<ReadingListItem[]> {
  try {
    const params = childId ? `?childId=${childId}` : "";
    return await fetchApi<ReadingListItem[]>(`/api/reading-list${params}`);
  } catch {
    return [];
  }
}

export async function createReadingListItem(
  item: Omit<ReadingListItem, "id">,
): Promise<ReadingListItem | null> {
  try {
    return await fetchApi<ReadingListItem>("/api/reading-list", {
      method: "POST",
      body: JSON.stringify(item),
    });
  } catch {
    return null;
  }
}

export async function updateReadingListItem(
  id: number,
  item: Partial<ReadingListItem>,
): Promise<ReadingListItem | null> {
  try {
    return await fetchApi<ReadingListItem>(`/api/reading-list/${id}`, {
      method: "PATCH",
      body: JSON.stringify(item),
    });
  } catch {
    return null;
  }
}

// --- School Tasks ---

export async function getSchoolTasks(
  childId?: number,
): Promise<SchoolTask[]> {
  try {
    const params = childId ? `?childId=${childId}` : "";
    return await fetchApi<SchoolTask[]>(`/api/school-tasks${params}`);
  } catch {
    return [];
  }
}

export async function createSchoolTask(
  task: Omit<SchoolTask, "id">,
): Promise<SchoolTask | null> {
  try {
    return await fetchApi<SchoolTask>("/api/school-tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  } catch {
    return null;
  }
}

export async function updateSchoolTask(
  id: number,
  task: Partial<SchoolTask>,
): Promise<SchoolTask | null> {
  try {
    return await fetchApi<SchoolTask>(`/api/school-tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(task),
    });
  } catch {
    return null;
  }
}

// --- Handover Notes ---

export async function getHandoverNotes(
  childId?: number,
): Promise<HandoverNote[]> {
  try {
    const params = childId ? `?childId=${childId}` : "";
    return await fetchApi<HandoverNote[]>(`/api/handover-notes${params}`);
  } catch {
    return [];
  }
}

export async function createHandoverNote(
  note: Omit<HandoverNote, "id">,
): Promise<HandoverNote | null> {
  try {
    return await fetchApi<HandoverNote>("/api/handover-notes", {
      method: "POST",
      body: JSON.stringify(note),
    });
  } catch {
    return null;
  }
}
