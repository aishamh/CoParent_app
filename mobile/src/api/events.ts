import { fetchApi } from "./client";
import type { Event } from "../types/schema";

export async function getEvents(childId?: number): Promise<Event[]> {
  try {
    const params = childId ? `?childId=${childId}` : "";
    return await fetchApi<Event[]>(`/api/events${params}`);
  } catch {
    return [];
  }
}

export async function createEvent(
  event: Omit<Event, "id">,
): Promise<Event | null> {
  try {
    return await fetchApi<Event>("/api/events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  } catch {
    return null;
  }
}

export async function updateEvent(
  id: number,
  event: Partial<Event>,
): Promise<Event | null> {
  try {
    return await fetchApi<Event>(`/api/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(event),
    });
  } catch {
    return null;
  }
}

export async function deleteEvent(id: number): Promise<boolean> {
  try {
    await fetchApi<void>(`/api/events/${id}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}
