import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCommunityEvent,
  getCommunityEvents,
  getCommunityEventSummary,
  getCommunityEvent,
  updateCommunityEvent,
  deleteCommunityEvent,
  rsvpToEvent,
  updateEventAttendance,
  getEventAttendees,
  type CommunityEventListResponse,
  type CommunityEventDetailResponse,
  type CommunityEventSummary,
  type EventAttendeeDetail,
} from "../api/communityEvents";
import type {
  CommunityEvent,
  InsertCommunityEvent,
  InsertEventAttendee,
  UpdateEventAttendee,
} from "../../shared/schema";

// ============================================================
// Community Events
// ============================================================

export function useCommunityEvents(params?: {
  category?: string;
  source?: string;
  age_min?: number;
  age_max?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  include_attended?: boolean;
}) {
  return useQuery({
    queryKey: ["communityEvents", params],
    queryFn: () => getCommunityEvents(params),
  });
}

export function useCommunityEventSummary() {
  return useQuery({
    queryKey: ["communityEventSummary"],
    queryFn: getCommunityEventSummary,
  });
}

export function useCommunityEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["communityEvent", id],
    queryFn: () => (id ? getCommunityEvent(id) : Promise.reject(new Error("No ID"))),
    enabled: !!id,
  });
}

export function useCreateCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertCommunityEvent) => createCommunityEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityEvents"] });
      queryClient.invalidateQueries({ queryKey: ["communityEventSummary"] });
    },
  });
}

export function useUpdateCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertCommunityEvent> }) =>
      updateCommunityEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["communityEvents"] });
      queryClient.invalidateQueries({ queryKey: ["communityEvent", id] });
    },
  });
}

export function useDeleteCommunityEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCommunityEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communityEvents"] });
      queryClient.invalidateQueries({ queryKey: ["communityEventSummary"] });
    },
  });
}

// ============================================================
// Event Attendees (RSVP)
// ============================================================

export function useEventAttendees(eventId: string | undefined) {
  return useQuery({
    queryKey: ["eventAttendees", eventId],
    queryFn: () =>
      eventId ? getEventAttendees(eventId) : Promise.resolve([]),
    enabled: !!eventId,
  });
}

export function useRsvpToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: InsertEventAttendee }) =>
      rsvpToEvent(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["communityEvents"] });
      queryClient.invalidateQueries({ queryKey: ["communityEvent", eventId] });
      queryClient.invalidateQueries({ queryKey: ["eventAttendees", eventId] });
      queryClient.invalidateQueries({ queryKey: ["communityEventSummary"] });
    },
  });
}

export function useUpdateEventAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      attendeeId,
      data,
    }: {
      eventId: string;
      attendeeId: string;
      data: UpdateEventAttendee;
    }) => updateEventAttendance(eventId, attendeeId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["communityEvents"] });
      queryClient.invalidateQueries({ queryKey: ["communityEvent", eventId] });
      queryClient.invalidateQueries({ queryKey: ["eventAttendees", eventId] });
      queryClient.invalidateQueries({ queryKey: ["communityEventSummary"] });
    },
  });
}
