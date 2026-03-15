import { fetchApi } from "./client";
import type { ChildInfoEntry } from "../types/schema";

export async function getChildInfoEntries(
  childId: number,
): Promise<ChildInfoEntry[]> {
  try {
    return await fetchApi<ChildInfoEntry[]>(`/api/child-info/${childId}`);
  } catch {
    return [];
  }
}

interface CreateChildInfoData {
  child_id: number;
  category: string;
  label: string;
  value: string;
}

export async function createChildInfoEntry(
  data: CreateChildInfoData,
): Promise<ChildInfoEntry | null> {
  try {
    return await fetchApi<ChildInfoEntry>("/api/child-info", {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

interface UpdateChildInfoData {
  label?: string;
  value?: string;
  category?: string;
}

export async function updateChildInfoEntry(
  id: string,
  data: UpdateChildInfoData,
): Promise<ChildInfoEntry | null> {
  try {
    return await fetchApi<ChildInfoEntry>(`/api/child-info/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  } catch {
    return null;
  }
}

export async function deleteChildInfoEntry(id: string): Promise<boolean> {
  try {
    await fetchApi<{ success: boolean }>(`/api/child-info/${id}`, {
      method: "DELETE",
    });
    return true;
  } catch {
    return false;
  }
}
