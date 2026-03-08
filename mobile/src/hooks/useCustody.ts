import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCustodySchedules,
  createCustodySchedule,
  deleteCustodySchedule,
  previewCustodySchedule,
  getSwapRequests,
  createSwapRequest,
  respondToSwapRequest,
} from "../api/custody";
import type { InsertCustodySchedule, InsertSwapRequest } from "../types/schema";

const SWAP_REFETCH_INTERVAL_MS = 30_000;

export function useCustodySchedules() {
  return useQuery({
    queryKey: ["custodySchedules"],
    queryFn: getCustodySchedules,
  });
}

export function useCreateCustodySchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertCustodySchedule) => createCustodySchedule(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["custodySchedules"] }),
  });
}

export function useDeleteCustodySchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustodySchedule,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["custodySchedules"] }),
  });
}

export function usePreviewCustodySchedule() {
  return useMutation({
    mutationFn: (data: InsertCustodySchedule) =>
      previewCustodySchedule(data),
  });
}

export function useSwapRequests() {
  return useQuery({
    queryKey: ["swapRequests"],
    queryFn: getSwapRequests,
    refetchInterval: SWAP_REFETCH_INTERVAL_MS,
  });
}

export function useCreateSwapRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertSwapRequest) => createSwapRequest(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["swapRequests"] }),
  });
}

export function useRespondToSwapRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      respondToSwapRequest(id, status),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["swapRequests"] }),
  });
}
