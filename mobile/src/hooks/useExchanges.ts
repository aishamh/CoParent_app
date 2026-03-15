import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getExchangeRecords,
  createExchangeRecord,
} from "../api/exchanges";

export function useExchangeRecords(from?: string, to?: string) {
  return useQuery({
    queryKey: ["exchanges", from, to],
    queryFn: () => getExchangeRecords(from, to),
  });
}

interface CreateExchangeParams {
  type: "dropoff" | "pickup";
  from_parent: string;
  to_parent: string;
  children: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  timestamp: string;
  status: "ontime" | "late" | "missed";
  notes?: string;
  photo_url?: string;
}

export function useCreateExchangeRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateExchangeParams) => createExchangeRecord(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["exchanges"] }),
  });
}
