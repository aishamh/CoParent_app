import { fetchApi } from "./client";
import type { Activity } from "../types/schema";

export async function getActivities(season?: string): Promise<Activity[]> {
  try {
    const params = season ? `?season=${encodeURIComponent(season)}` : "";
    return await fetchApi<Activity[]>(`/api/activities${params}`);
  } catch {
    return [];
  }
}

export async function createActivity(
  activity: Omit<Activity, "id">,
): Promise<Activity | null> {
  try {
    return await fetchApi<Activity>("/api/activities", {
      method: "POST",
      body: JSON.stringify(activity),
    });
  } catch {
    return null;
  }
}

export async function getOsloEvents(): Promise<unknown[]> {
  try {
    return await fetchApi<unknown[]>("/api/oslo-events");
  } catch {
    return [];
  }
}
