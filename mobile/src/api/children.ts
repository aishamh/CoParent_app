import { fetchApi, type PaginatedResponse } from "./client";
import type { Child } from "../types/schema";

export async function getChildren(): Promise<Child[]> {
  try {
    const response = await fetchApi<PaginatedResponse<Child>>("/api/children");
    return response.data;
  } catch {
    return [];
  }
}

export async function getChild(id: number): Promise<Child | null> {
  try {
    return await fetchApi<Child>(`/api/children/${id}`);
  } catch {
    return null;
  }
}

export async function createChild(
  child: Omit<Child, "id">,
): Promise<Child | null> {
  try {
    return await fetchApi<Child>("/api/children", {
      method: "POST",
      body: JSON.stringify(child),
    });
  } catch {
    return null;
  }
}

export async function updateChild(
  id: number,
  updates: Partial<Child>,
): Promise<Child | null> {
  try {
    return await fetchApi<Child>(`/api/children/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch {
    return null;
  }
}
