import { z } from "zod";

// ============================================================
// CoParent App - Type Definitions (Vercel Postgres)
// ============================================================
// Types mirror the PostgreSQL tables. Drizzle table definitions
// live in server/tables.ts (server-only, not bundled in client).
// ============================================================

// --- Families ---
export interface Family {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}

// --- Users (server-side, includes password) ---
export interface User {
  id: string;
  username: string;
  email: string | null;
  password: string;
  display_name: string | null;
  role: string;
  family_id: string | null;
  avatar_url: string | null;
  parent_a_name: string | null;
  parent_b_name: string | null;
  created_at: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email().nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().nullable().optional(),
  role: z.string().default("parent_a"),
});
export type InsertUser = z.infer<typeof insertUserSchema>;

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// --- Profiles (client-facing, no password) ---
export interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  role: string;
  family_id: string | null;
  display_name: string | null;
  avatar_url: string | null;
  parent_a_name: string | null;
  parent_b_name: string | null;
  created_at: string;
}

// --- Children ---
export interface Child {
  id: number;
  family_id: string;
  name: string;
  age: number;
  gender: string | null;
  interests: string;
  created_at: string;
}

export const insertChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(18),
  gender: z.string().nullable().optional(),
  interests: z.string().default("[]"),
});
export type InsertChild = z.infer<typeof insertChildSchema>;

// --- Events ---
export interface Event {
  id: number;
  family_id: string;
  child_id: number | null;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  time_zone: string;
  parent: string;
  type: string;
  recurrence: string | null;
  recurrence_interval: number;
  recurrence_end: string | null;
  recurrence_days: string | null;
  description: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  created_at: string;
}

export const insertEventSchema = z.object({
  child_id: z.number().nullable().optional(),
  title: z.string().min(1, "Title is required"),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  start_time: z.string().default("00:00"),
  end_time: z.string().default("23:59"),
  time_zone: z.string().default("Europe/Oslo"),
  parent: z.string().min(1),
  type: z.enum(["custody", "holiday", "activity", "travel", "medical", "school", "other"]),
  recurrence: z.string().nullable().optional(),
  recurrence_interval: z.number().default(1),
  recurrence_end: z.string().nullable().optional(),
  recurrence_days: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;

// --- Activities ---
export interface Activity {
  id: number;
  title: string;
  category: string;
  age_range: string;
  duration: string;
  image: string | null;
  description: string;
  season: string | null;
  created_at: string;
}

export const insertActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1),
  age_range: z.string().min(1),
  duration: z.string().min(1),
  image: z.string().nullable().optional(),
  description: z.string().min(1),
  season: z.string().nullable().optional(),
});
export type InsertActivity = z.infer<typeof insertActivitySchema>;

// --- Friends ---
export interface Friend {
  id: number;
  family_id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  relation: string;
  kids: string;
  created_at: string;
}

export const insertFriendSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable().optional(),
  avatar: z.string().nullable().optional(),
  relation: z.string().min(1),
  kids: z.string().default("[]"),
});
export type InsertFriend = z.infer<typeof insertFriendSchema>;

// --- Social Events ---
export interface SocialEvent {
  id: number;
  family_id: string;
  title: string;
  date: string;
  location: string | null;
  friend_id: number | null;
  description: string | null;
  rsvp_status: string;
  created_at: string;
}

export const insertSocialEventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  location: z.string().nullable().optional(),
  friend_id: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  rsvp_status: z.enum(["pending", "accepted", "declined"]).default("pending"),
});
export type InsertSocialEvent = z.infer<typeof insertSocialEventSchema>;

// --- Reading List ---
export interface ReadingListItem {
  id: number;
  family_id: string;
  child_id: number;
  title: string;
  author: string;
  progress: number;
  assigned_to: string;
  cover: string | null;
  created_at: string;
}

export const insertReadingListSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  author: z.string().min(1),
  progress: z.number().min(0).max(100).default(0),
  assigned_to: z.string().min(1),
  cover: z.string().nullable().optional(),
});
export type InsertReadingListItem = z.infer<typeof insertReadingListSchema>;

// --- School Tasks ---
export interface SchoolTask {
  id: number;
  family_id: string;
  child_id: number;
  title: string;
  due_date: string;
  status: string;
  platform: string | null;
  description: string | null;
  created_at: string;
}

export const insertSchoolTaskSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  due_date: z.string().min(1),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  platform: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});
export type InsertSchoolTask = z.infer<typeof insertSchoolTaskSchema>;

// --- Handover Notes ---
export interface HandoverNote {
  id: number;
  family_id: string;
  child_id: number;
  parent: string;
  message: string;
  created_at: string;
}

export const insertHandoverNoteSchema = z.object({
  child_id: z.number(),
  parent: z.string().min(1),
  message: z.string().min(1),
});
export type InsertHandoverNote = z.infer<typeof insertHandoverNoteSchema>;

// --- Expenses ---
export interface Expense {
  id: number;
  family_id: string;
  child_id: number;
  title: string;
  amount: number;
  category: string;
  paid_by: string;
  split_percentage: number;
  date: string;
  receipt: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const insertExpenseSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  amount: z.number().min(0),
  category: z.enum(["medical", "education", "activities", "clothing", "food", "transport", "other"]),
  paid_by: z.string().min(1),
  split_percentage: z.number().min(0).max(100).default(50),
  date: z.string().min(1),
  receipt: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "reimbursed"]).default("pending"),
  notes: z.string().nullable().optional(),
});
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// --- Messages ---
export interface Message {
  id: string;
  family_id: string;
  sender_id: string;
  receiver_id: string;
  subject: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  content_hash: string;
  sender_ip: string | null;
  created_at: string;
}

export const insertMessageSchema = z.object({
  receiver_id: z.string().min(1),
  subject: z.string().nullable().optional(),
  content: z.string().min(1, "Message cannot be empty"),
});
export type InsertMessage = z.infer<typeof insertMessageSchema>;

// --- Documents ---
export interface Document {
  id: string;
  family_id: string;
  uploaded_by: string;
  child_id: number | null;
  title: string;
  description: string | null;
  category: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  shared_with: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const insertDocumentSchema = z.object({
  child_id: z.number().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.enum(["medical", "legal", "receipt", "school", "court", "other"]),
  tags: z.array(z.string()).default([]),
});
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

// --- Oslo Events (external API response) ---
export interface OsloEvent {
  id: string;
  title: string;
  name: string;
  description: string;
  startDate: string;
  startTime: string;
  location: { name: string };
  categories: { name: string }[];
  image: { url: string };
  isFree: boolean;
  price?: string;
  url: string;
}
