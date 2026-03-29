// ============================================================
// API Layer - HTTP fetch calls to Express backend
// ============================================================
// All operations go through the /api/* endpoints. Auth tokens
// are stored in localStorage and sent as Bearer tokens.
// ============================================================

import type {
  Child, Event, Activity, Friend, SocialEvent,
  ReadingListItem, SchoolTask, HandoverNote,
  Expense, Message, Document as AppDocument, Profile,
} from "@shared/schema";

let authToken: string | null = localStorage.getItem("coparent_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("coparent_token", token);
  } else {
    localStorage.removeItem("coparent_token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  // Only set Content-Type for JSON payloads (not FormData)
  const isFormData = options?.body instanceof FormData;
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options?.headers as Record<string, string>) },
    credentials: "include",
  });

  if (!response.ok) {
    const text = await response.text();
    let message = "Request failed";
    try {
      const json = JSON.parse(text);
      message = json.error || json.message || message;
    } catch {
      message = text || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

// --- Auth ---
export async function authLogin(username: string, password: string) {
  return fetchApi<{ token: string } & Record<string, unknown>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function authRegister(data: {
  username: string;
  email?: string;
  password: string;
  display_name?: string;
  role?: string;
}) {
  return fetchApi<{ token: string } & Record<string, unknown>>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function authLogout(): Promise<void> {
  try { await fetchApi("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
  setAuthToken(null);
}

export async function authGetMe(): Promise<Profile | null> {
  try {
    return await fetchApi<Profile>("/api/auth/me");
  } catch {
    return null;
  }
}

// --- Children ---
export async function getChildren(): Promise<Child[]> {
  try { return await fetchApi("/api/children"); } catch { return []; }
}

export async function getChild(id: number): Promise<Child | null> {
  try { return await fetchApi(`/api/children/${id}`); } catch { return null; }
}

export async function createChild(child: Record<string, unknown>): Promise<Child | null> {
  try { return await fetchApi("/api/children", { method: "POST", body: JSON.stringify(child) }); } catch { return null; }
}

export async function updateChild(id: number, updates: Partial<Child>): Promise<Child | null> {
  try { return await fetchApi(`/api/children/${id}`, { method: "PATCH", body: JSON.stringify(updates) }); } catch { return null; }
}

// --- Events ---
export async function getEvents(childId?: number): Promise<Event[]> {
  const params = childId ? `?childId=${childId}` : "";
  try { return await fetchApi(`/api/events${params}`); } catch { return []; }
}

export async function createEvent(event: Record<string, unknown>): Promise<Event | null> {
  try { return await fetchApi("/api/events", { method: "POST", body: JSON.stringify(event) }); } catch { return null; }
}

export async function updateEvent(id: number, event: Partial<Event>): Promise<Event | null> {
  try { return await fetchApi(`/api/events/${id}`, { method: "PATCH", body: JSON.stringify(event) }); } catch { return null; }
}

export async function deleteEvent(id: number): Promise<boolean> {
  try { await fetchApi(`/api/events/${id}`, { method: "DELETE" }); return true; } catch { return false; }
}

// --- Activities ---
export async function getActivities(season?: string): Promise<Activity[]> {
  const params = season ? `?season=${season}` : "";
  try { return await fetchApi(`/api/activities${params}`); } catch { return []; }
}

export async function createActivity(activity: Record<string, unknown>): Promise<Activity | null> {
  try { return await fetchApi("/api/activities", { method: "POST", body: JSON.stringify(activity) }); } catch { return null; }
}

// --- Oslo Events ---
export async function getOsloEvents(): Promise<Record<string, unknown>> {
  try { return await fetchApi("/api/oslo-events"); } catch { return { items: [] }; }
}

// --- Friends ---
export async function getFriends(): Promise<Friend[]> {
  try { return await fetchApi("/api/friends"); } catch { return []; }
}

export async function createFriend(friend: Record<string, unknown>): Promise<Friend | null> {
  try { return await fetchApi("/api/friends", { method: "POST", body: JSON.stringify(friend) }); } catch { return null; }
}

export async function updateFriend(id: number, updates: Partial<Friend>): Promise<Friend | null> {
  try { return await fetchApi(`/api/friends/${id}`, { method: "PATCH", body: JSON.stringify(updates) }); } catch { return null; }
}

export async function deleteFriend(id: number): Promise<boolean> {
  try { await fetchApi(`/api/friends/${id}`, { method: "DELETE" }); return true; } catch { return false; }
}

// --- Social Events ---
export async function getSocialEvents(): Promise<SocialEvent[]> {
  try { return await fetchApi("/api/social-events"); } catch { return []; }
}

export async function createSocialEvent(event: Record<string, unknown>): Promise<SocialEvent | null> {
  try { return await fetchApi("/api/social-events", { method: "POST", body: JSON.stringify(event) }); } catch { return null; }
}

export async function updateSocialEvent(id: number, event: Partial<SocialEvent>): Promise<SocialEvent | null> {
  try { return await fetchApi(`/api/social-events/${id}`, { method: "PATCH", body: JSON.stringify(event) }); } catch { return null; }
}

// --- Reading List ---
export async function getReadingList(childId?: number): Promise<ReadingListItem[]> {
  const params = childId ? `?childId=${childId}` : "";
  try { return await fetchApi(`/api/reading-list${params}`); } catch { return []; }
}

export async function createReadingListItem(item: Record<string, unknown>): Promise<ReadingListItem | null> {
  try { return await fetchApi("/api/reading-list", { method: "POST", body: JSON.stringify(item) }); } catch { return null; }
}

export async function updateReadingListItem(id: number, item: Partial<ReadingListItem>): Promise<ReadingListItem | null> {
  try { return await fetchApi(`/api/reading-list/${id}`, { method: "PATCH", body: JSON.stringify(item) }); } catch { return null; }
}

// --- School Tasks ---
export async function getSchoolTasks(childId?: number): Promise<SchoolTask[]> {
  const params = childId ? `?childId=${childId}` : "";
  try { return await fetchApi(`/api/school-tasks${params}`); } catch { return []; }
}

export async function createSchoolTask(task: Record<string, unknown>): Promise<SchoolTask | null> {
  try { return await fetchApi("/api/school-tasks", { method: "POST", body: JSON.stringify(task) }); } catch { return null; }
}

export async function updateSchoolTask(id: number, task: Partial<SchoolTask>): Promise<SchoolTask | null> {
  try { return await fetchApi(`/api/school-tasks/${id}`, { method: "PATCH", body: JSON.stringify(task) }); } catch { return null; }
}

// --- Handover Notes ---
export async function getHandoverNotes(childId?: number): Promise<HandoverNote[]> {
  const params = childId ? `?childId=${childId}` : "";
  try { return await fetchApi(`/api/handover-notes${params}`); } catch { return []; }
}

export async function createHandoverNote(note: Record<string, unknown>): Promise<HandoverNote | null> {
  try { return await fetchApi("/api/handover-notes", { method: "POST", body: JSON.stringify(note) }); } catch { return null; }
}

// --- Expenses ---
export async function getExpenses(childId?: number, status?: string): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (childId) params.set("childId", String(childId));
  if (status) params.set("status", status);
  const qs = params.toString();
  try { return await fetchApi(`/api/expenses${qs ? `?${qs}` : ""}`); } catch { return []; }
}

export async function createExpense(expense: Record<string, unknown>): Promise<Expense | null> {
  try { return await fetchApi("/api/expenses", { method: "POST", body: JSON.stringify(expense) }); } catch { return null; }
}

export async function updateExpense(id: number, expense: Partial<Expense>): Promise<Expense | null> {
  try { return await fetchApi(`/api/expenses/${id}`, { method: "PATCH", body: JSON.stringify(expense) }); } catch { return null; }
}

export async function deleteExpense(id: number): Promise<boolean> {
  try { await fetchApi(`/api/expenses/${id}`, { method: "DELETE" }); return true; } catch { return false; }
}

// --- Messages ---
export async function getMessages(otherUserId?: string): Promise<Message[]> {
  const params = otherUserId ? `?otherUserId=${otherUserId}` : "";
  try { return await fetchApi(`/api/messages${params}`); } catch { return []; }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const result = await fetchApi<{ count: number }>("/api/messages/unread-count");
    return result.count;
  } catch {
    return 0;
  }
}

export async function sendMessage(message: { receiver_id: string; content: string; subject?: string }): Promise<Message | null> {
  try { return await fetchApi("/api/messages", { method: "POST", body: JSON.stringify(message) }); } catch { return null; }
}

export async function markMessageAsRead(id: string): Promise<void> {
  try { await fetchApi(`/api/messages/${id}/read`, { method: "PATCH" }); } catch { /* ignore */ }
}

// --- Documents ---
export async function getDocuments(category?: string, childId?: number): Promise<AppDocument[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (childId) params.set("childId", String(childId));
  const qs = params.toString();
  try { return await fetchApi(`/api/documents${qs ? `?${qs}` : ""}`); } catch { return []; }
}

export async function uploadDocument(
  file: File,
  metadata: { title?: string; description?: string; category?: string; childId?: number; tags?: string[] }
): Promise<AppDocument | null> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (metadata.title) formData.append("title", metadata.title);
    if (metadata.description) formData.append("description", metadata.description);
    if (metadata.category) formData.append("category", metadata.category);
    if (metadata.childId) formData.append("childId", String(metadata.childId));
    if (metadata.tags) formData.append("tags", JSON.stringify(metadata.tags));

    return await fetchApi("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
  } catch {
    return null;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try { await fetchApi(`/api/documents/${id}`, { method: "DELETE" }); return true; } catch { return false; }
}

// --- Profiles (user settings) ---
export async function getProfile(userId: string): Promise<Profile | null> {
  return authGetMe();
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try { return await fetchApi("/api/auth/me", { method: "PATCH", body: JSON.stringify(updates) }); } catch { return null; }
}

// --- Namespace export ---
export const api = {
  getProfile,
  updateProfile,
  getChildren,
  getChild,
  createChild,
  updateChild,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getActivities,
  createActivity,
  getOsloEvents,
  getFriends,
  createFriend,
  updateFriend,
  deleteFriend,
  getSocialEvents,
  createSocialEvent,
  updateSocialEvent,
  getReadingList,
  createReadingListItem,
  updateReadingListItem,
  getSchoolTasks,
  createSchoolTask,
  updateSchoolTask,
  getHandoverNotes,
  createHandoverNote,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getMessages,
  getUnreadCount,
  sendMessage,
  markMessageAsRead,
  getDocuments,
  uploadDocument,
  deleteDocument,
};
