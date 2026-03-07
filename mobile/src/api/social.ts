import { fetchApi } from "./client";
import type { Friend, SocialEvent } from "../types/schema";

// --- Friends ---

export async function getFriends(): Promise<Friend[]> {
  try {
    return await fetchApi<Friend[]>("/api/friends");
  } catch {
    return [];
  }
}

export async function createFriend(
  friend: Omit<Friend, "id">,
): Promise<Friend | null> {
  try {
    return await fetchApi<Friend>("/api/friends", {
      method: "POST",
      body: JSON.stringify(friend),
    });
  } catch {
    return null;
  }
}

export async function updateFriend(
  id: number,
  updates: Partial<Friend>,
): Promise<Friend | null> {
  try {
    return await fetchApi<Friend>(`/api/friends/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  } catch {
    return null;
  }
}

// --- Social Events ---

export async function getSocialEvents(): Promise<SocialEvent[]> {
  try {
    return await fetchApi<SocialEvent[]>("/api/social-events");
  } catch {
    return [];
  }
}

export async function createSocialEvent(
  event: Omit<SocialEvent, "id">,
): Promise<SocialEvent | null> {
  try {
    return await fetchApi<SocialEvent>("/api/social-events", {
      method: "POST",
      body: JSON.stringify(event),
    });
  } catch {
    return null;
  }
}

export async function updateSocialEvent(
  id: number,
  event: Partial<SocialEvent>,
): Promise<SocialEvent | null> {
  try {
    return await fetchApi<SocialEvent>(`/api/social-events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(event),
    });
  } catch {
    return null;
  }
}
