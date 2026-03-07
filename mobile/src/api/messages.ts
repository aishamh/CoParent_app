import { fetchApi, type PaginatedResponse } from "./client";
import type { Message } from "../types/schema";

export async function getMessages(otherUserId?: number): Promise<Message[]> {
  try {
    const params = otherUserId ? `?otherUserId=${otherUserId}` : "";
    const response = await fetchApi<PaginatedResponse<Message>>(`/api/messages${params}`);
    return response.data;
  } catch {
    return [];
  }
}

interface SendMessageData {
  receiver_id: number;
  content: string;
  subject?: string;
}

export async function sendMessage(
  msg: SendMessageData,
): Promise<Message | null> {
  try {
    return await fetchApi<Message>("/api/messages", {
      method: "POST",
      body: JSON.stringify(msg),
    });
  } catch {
    return null;
  }
}

export async function markMessageAsRead(id: number): Promise<void> {
  try {
    await fetchApi<void>(`/api/messages/${id}/read`, { method: "PATCH" });
  } catch {
    // Silently fail - non-critical operation
  }
}

interface UnreadCountResponse {
  count: number;
}

export async function getUnreadCount(): Promise<number> {
  try {
    const result = await fetchApi<UnreadCountResponse>(
      "/api/messages/unread-count",
    );
    return result.count;
  } catch {
    return 0;
  }
}
