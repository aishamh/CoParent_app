import { pgTable, text, integer, serial, boolean, real, jsonb } from "drizzle-orm/pg-core";
import crypto from "crypto";

// ============================================================
// Drizzle pgTable Definitions (server-only)
// ============================================================
// These define the PostgreSQL schema via Drizzle ORM.
// Only imported by server code — never bundled in the client.
// Column names use snake_case to match PostgreSQL conventions
// and the TypeScript interfaces in shared/schema.ts.
// ============================================================

const generateId = () => crypto.randomUUID();
const nowIso = () => new Date().toISOString();

export const families = pgTable("families", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  invite_code: text("invite_code").notNull(),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  username: text("username").notNull().unique(),
  email: text("email"),
  password: text("password").notNull(),
  display_name: text("display_name"),
  role: text("role").notNull().default("parent_a"),
  family_id: text("family_id"),
  avatar_url: text("avatar_url"),
  parent_a_name: text("parent_a_name"),
  parent_b_name: text("parent_b_name"),
  venmo_username: text("venmo_username"),
  paypal_email: text("paypal_email"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  interests: text("interests").notNull().default("[]"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id"),
  title: text("title").notNull(),
  start_date: text("start_date").notNull(),
  end_date: text("end_date").notNull(),
  start_time: text("start_time").notNull().default("00:00"),
  end_time: text("end_time").notNull().default("23:59"),
  time_zone: text("time_zone").notNull().default("Europe/Oslo"),
  parent: text("parent").notNull(),
  type: text("type").notNull(),
  recurrence: text("recurrence"),
  recurrence_interval: integer("recurrence_interval").notNull().default(1),
  recurrence_end: text("recurrence_end"),
  recurrence_days: text("recurrence_days"),
  description: text("description"),
  location: text("location"),
  address: text("address"),
  city: text("city"),
  postal_code: text("postal_code"),
  schedule_id: text("schedule_id"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  age_range: text("age_range").notNull(),
  duration: text("duration").notNull(),
  image: text("image"),
  description: text("description").notNull(),
  season: text("season"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  relation: text("relation").notNull(),
  kids: text("kids").notNull().default("[]"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const socialEvents = pgTable("social_events", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  friend_id: integer("friend_id"),
  description: text("description"),
  rsvp_status: text("rsvp_status").notNull().default("pending"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const readingList = pgTable("reading_list", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  progress: integer("progress").notNull().default(0),
  assigned_to: text("assigned_to").notNull(),
  cover: text("cover"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const schoolTasks = pgTable("school_tasks", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  title: text("title").notNull(),
  due_date: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  platform: text("platform"),
  description: text("description"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const handoverNotes = pgTable("handover_notes", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  parent: text("parent").notNull(),
  message: text("message").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  title: text("title").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  paid_by: text("paid_by").notNull(),
  split_percentage: real("split_percentage").notNull().default(50),
  date: text("date").notNull(),
  receipt: text("receipt"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  sender_id: text("sender_id").notNull(),
  receiver_id: text("receiver_id").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  is_read: boolean("is_read").notNull().default(false),
  read_at: text("read_at"),
  content_hash: text("content_hash").notNull(),
  sender_ip: text("sender_ip"),
  tone_score: text("tone_score"),
  tone_overridden: boolean("tone_overridden").notNull().default(false),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

// ============================================================
// Phase 1: Push Notifications (Direct APNs)
// ============================================================

export const deviceTokens = pgTable("device_tokens", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull(),
  token: text("token").notNull().unique(),
  platform: text("platform").notNull().default("ios"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull().unique(),
  messages_enabled: boolean("messages_enabled").notNull().default(true),
  calendar_enabled: boolean("calendar_enabled").notNull().default(true),
  expenses_enabled: boolean("expenses_enabled").notNull().default(true),
  custody_reminders_enabled: boolean("custody_reminders_enabled").notNull().default(true),
  tone_coaching_enabled: boolean("tone_coaching_enabled").notNull().default(true),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
});

// ============================================================
// Phase 2: PDF Export Engine
// ============================================================

export const exportAuditLog = pgTable("export_audit_log", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  user_id: text("user_id").notNull(),
  export_type: text("export_type").notNull(),
  date_range_start: text("date_range_start"),
  date_range_end: text("date_range_end"),
  record_count: integer("record_count").notNull(),
  document_hash: text("document_hash").notNull(),
  file_path: text("file_path").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

// ============================================================
// Phase 3: Custody Schedule Templates
// ============================================================

export const custodySchedules = pgTable("custody_schedules", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id"),
  template_type: text("template_type").notNull(),
  start_date: text("start_date").notNull(),
  parent_a_id: text("parent_a_id").notNull(),
  parent_b_id: text("parent_b_id").notNull(),
  custom_pattern: jsonb("custom_pattern").$type<number[]>(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const custodySwapRequests = pgTable("custody_swap_requests", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  schedule_id: text("schedule_id").notNull(),
  requested_by: text("requested_by").notNull(),
  original_date: text("original_date").notNull(),
  proposed_date: text("proposed_date").notNull(),
  reason: text("reason"),
  status: text("status").notNull().default("pending"),
  responded_at: text("responded_at"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

// ============================================================
// Phase 5: Attorney/Mediator Portals
// ============================================================

export const professionalInvites = pgTable("professional_invites", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  invite_code: text("invite_code").notNull().unique(),
  role: text("role").notNull(),
  invited_by: text("invited_by").notNull(),
  email: text("email"),
  expires_at: text("expires_at").notNull(),
  accepted_by: text("accepted_by"),
  revoked: boolean("revoked").notNull().default(false),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

export const professionalAccess = pgTable("professional_access", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  user_id: text("user_id").notNull(),
  role: text("role").notNull(),
  granted_by: text("granted_by").notNull(),
  can_view_messages: boolean("can_view_messages").notNull().default(true),
  can_view_calendar: boolean("can_view_calendar").notNull().default(true),
  can_view_expenses: boolean("can_view_expenses").notNull().default(true),
  can_view_documents: boolean("can_view_documents").notNull().default(true),
  can_export: boolean("can_export").notNull().default(true),
  is_active: boolean("is_active").notNull().default(true),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
});

// ============================================================
// Existing tables
// ============================================================

export const documents = pgTable("documents", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  uploaded_by: text("uploaded_by").notNull(),
  child_id: integer("child_id"),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  file_path: text("file_path").notNull(),
  file_name: text("file_name").notNull(),
  file_size: integer("file_size").notNull(),
  file_type: text("file_type").notNull(),
  shared_with: jsonb("shared_with").$type<string[]>().notNull().default([]),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
});
