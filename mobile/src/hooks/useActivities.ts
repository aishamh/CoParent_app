import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getActivities,
  createActivity,
  getOsloEvents,
} from "../api/activities";

export function useActivities(season?: string) {
  return useQuery({
    queryKey: season ? ["activities", season] : ["activities"],
    queryFn: () => getActivities(season),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createActivity,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useOsloEvents() {
  return useQuery({
    queryKey: ["osloEvents"],
    queryFn: getOsloEvents,
  });
}
