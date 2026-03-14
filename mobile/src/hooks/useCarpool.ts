import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCarpoolArrangement,
  getCarpoolArrangements,
  updateCarpoolArrangement,
  matchCarpoolArrangement,
  deleteCarpoolArrangement,
} from "../api/communityEvents";
import type {
  InsertCarpoolArrangement,
  UpdateCarpoolArrangement,
  CarpoolArrangement,
} from "../../shared/schema";

// ============================================================
// Carpool Arrangements
// ============================================================

export function useCarpoolArrangements(
  eventId: string | undefined,
  type?: "need_ride" | "offering_ride",
) {
  return useQuery({
    queryKey: ["carpoolArrangements", eventId, type],
    queryFn: () =>
      eventId ? getCarpoolArrangements(eventId, type) : Promise.resolve([]),
    enabled: !!eventId,
  });
}

export function useCreateCarpoolArrangement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventId,
      data,
    }: {
      eventId: string;
      data: InsertCarpoolArrangement;
    }) => createCarpoolArrangement(eventId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ["carpoolArrangements", eventId] });
    },
  });
}

export function useUpdateCarpoolArrangement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCarpoolArrangement }) =>
      updateCarpoolArrangement(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate all carpool queries since we don't know the eventId from id alone
      queryClient.invalidateQueries({ queryKey: ["carpoolArrangements"] });
    },
  });
}

export function useMatchCarpoolArrangement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, withId }: { id: string; withId: string }) =>
      matchCarpoolArrangement(id, withId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carpoolArrangements"] });
    },
  });
}

export function useDeleteCarpoolArrangement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCarpoolArrangement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carpoolArrangements"] });
    },
  });
}
