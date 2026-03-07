import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFriends,
  createFriend,
  updateFriend,
  getSocialEvents,
  createSocialEvent,
  updateSocialEvent,
} from "../api/social";
import type { Friend, SocialEvent } from "../types/schema";

// --- Friends ---

export function useFriends() {
  return useQuery({
    queryKey: ["friends"],
    queryFn: getFriends,
  });
}

export function useCreateFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFriend,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });
}

export function useUpdateFriend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Friend>;
    }) => updateFriend(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });
}

// --- Social Events ---

export function useSocialEvents() {
  return useQuery({
    queryKey: ["socialEvents"],
    queryFn: getSocialEvents,
  });
}

export function useCreateSocialEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSocialEvent,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] }),
  });
}

export function useUpdateSocialEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<SocialEvent>;
    }) => updateSocialEvent(id, updates),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["socialEvents"] }),
  });
}
