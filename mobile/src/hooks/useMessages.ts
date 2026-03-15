import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
} from "../api/messages";

const REFETCH_INTERVAL_MS = 15_000;

export function useMessages(otherUserId?: string) {
  return useQuery({
    queryKey: otherUserId ? ["messages", otherUserId] : ["messages"],
    queryFn: () => getMessages(otherUserId),
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["messages"] }),
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: REFETCH_INTERVAL_MS,
  });
}
