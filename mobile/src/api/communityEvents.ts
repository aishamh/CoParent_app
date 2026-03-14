import { fetchApi } from "./client";
import type {
  CommunityEvent,
  InsertCommunityEvent,
  EventAttendee,
  InsertEventAttendee,
  UpdateEventAttendee,
  CarpoolArrangement,
  InsertCarpoolArrangement,
  UpdateCarpoolArrangement,
} from "../types/schema";

// ============================================================
// Types
// ============================================================

export interface CommunityEventListResponse {
  data: (CommunityEvent & { user_rsvp_status: string | null })[];
  recommended: (CommunityEvent & { user_rsvp_status: string | null })[];
  total: number;
}

export interface CommunityEventDetailResponse extends CommunityEvent {
  user_rsvp_status: string | null;
  attendees: EventAttendeeDetail[];
  carpools: CarpoolArrangement[];
}

export interface EventAttendeeDetail {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  status: "going" | "interested" | "declined";
  attending_children: number[];
  notes: string | null;
}

export interface CommunityEventSummary {
  upcoming_week: (CommunityEvent & {
    user_rsvp_status: string | null;
    going_count: number;
  })[];
  total_this_month: number;
  your_rsvps: number;
}

// ============================================================
// Community Events
// ============================================================

export async function createCommunityEvent(data: InsertCommunityEvent): Promise<CommunityEvent> {
  return fetchApi<CommunityEvent>("/api/community-events", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCommunityEvents(params?: {
  category?: string;
  source?: string;
  age_min?: number;
  age_max?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  include_attended?: boolean;
}): Promise<CommunityEventListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append("category", params.category);
  if (params?.source) queryParams.append("source", params.source);
  if (params?.age_min !== undefined) queryParams.append("age_min", params.age_min.toString());
  if (params?.age_max !== undefined) queryParams.append("age_max", params.age_max.toString());
  if (params?.from) queryParams.append("from", params.from);
  if (params?.to) queryParams.append("to", params.to);
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.include_attended) queryParams.append("include_attended", "true");

  const query = queryParams.toString();
  return fetchApi<CommunityEventListResponse>(
    `/api/community-events${query ? `?${query}` : ""}`,
  );
}

export async function getCommunityEventSummary(): Promise<CommunityEventSummary> {
  return fetchApi<CommunityEventSummary>("/api/community-events/summary");
}

export async function getCommunityEvent(id: string): Promise<CommunityEventDetailResponse> {
  return fetchApi<CommunityEventDetailResponse>(`/api/community-events/${id}`);
}

export async function updateCommunityEvent(
  id: string,
  data: Partial<InsertCommunityEvent>,
): Promise<CommunityEvent> {
  return fetchApi<CommunityEvent>(`/api/community-events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCommunityEvent(id: string): Promise<void> {
  return fetchApi<void>(`/api/community-events/${id}`, {
    method: "DELETE",
  });
}

// ============================================================
// Event Attendees (RSVP)
// ============================================================

export async function rsvpToEvent(
  eventId: string,
  data: InsertEventAttendee,
): Promise<EventAttendee> {
  return fetchApi<EventAttendee>(`/api/community-events/${eventId}/attend`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEventAttendance(
  eventId: string,
  attendeeId: string,
  data: UpdateEventAttendee,
): Promise<EventAttendee> {
  return fetchApi<EventAttendee>(
    `/api/community-events/${eventId}/attendees/${attendeeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function getEventAttendees(eventId: string): Promise<EventAttendeeDetail[]> {
  return fetchApi<EventAttendeeDetail[]>(`/api/community-events/${eventId}/attendees`);
}

// ============================================================
// Carpool Arrangements
// ============================================================

export async function createCarpoolArrangement(
  eventId: string,
  data: InsertCarpoolArrangement,
): Promise<CarpoolArrangement> {
  return fetchApi<CarpoolArrangement>(`/api/community-events/${eventId}/carpool`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCarpoolArrangements(
  eventId: string,
  type?: "need_ride" | "offering_ride",
): Promise<(CarpoolArrangement & {
  username: string | null;
  display_name: string | null;
})[]> {
  const query = type ? `?type=${type}` : "";
  return fetchApi<any[]>(`/api/community-events/${eventId}/carpool${query}`);
}

export async function updateCarpoolArrangement(
  id: string,
  data: UpdateCarpoolArrangement,
): Promise<CarpoolArrangement> {
  return fetchApi<CarpoolArrangement>(`/api/carpool/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function matchCarpoolArrangement(
  id: string,
  withId: string,
): Promise<{ message: string; carpool_id: string }> {
  return fetchApi<{ message: string; carpool_id: string }>(
    `/api/carpool/${id}/match/${withId}`,
    {
      method: "POST",
    },
  );
}

export async function deleteCarpoolArrangement(id: string): Promise<void> {
  return fetchApi<void>(`/api/carpool/${id}`, {
    method: "DELETE",
  });
}
