import { pgTable, text, integer, serial, boolean, real, jsonb, index } from "drizzle-orm/pg-core";
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
  apple_user_identifier: text("apple_user_identifier"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_users_family_id").on(table.family_id),
  index("idx_users_apple_id").on(table.apple_user_identifier),
]);

export const children = pgTable("children", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  interests: text("interests").notNull().default("[]"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_children_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_events_family_id").on(table.family_id),
  index("idx_events_start_date").on(table.start_date),
  index("idx_events_schedule_id").on(table.schedule_id),
]);

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
}, (table) => [
  index("idx_friends_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_social_events_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_reading_list_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_school_tasks_family_id").on(table.family_id),
]);

export const handoverNotes = pgTable("handover_notes", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  parent: text("parent").notNull(),
  message: text("message").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_handover_notes_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_expenses_family_id").on(table.family_id),
  index("idx_expenses_paid_by").on(table.paid_by),
]);

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
  attachment_url: text("attachment_url"),
  attachment_type: text("attachment_type"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_messages_family_id").on(table.family_id),
  index("idx_messages_sender_id").on(table.sender_id),
  index("idx_messages_receiver_id").on(table.receiver_id),
  index("idx_messages_created_at").on(table.created_at),
  index("idx_messages_receiver_unread").on(table.receiver_id, table.is_read),
]);

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
}, (table) => [
  index("idx_device_tokens_user_id").on(table.user_id),
]);

export const notificationPreferences = pgTable("notification_preferences", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull().unique(),
  messages_enabled: boolean("messages_enabled").notNull().default(true),
  calendar_enabled: boolean("calendar_enabled").notNull().default(true),
  expenses_enabled: boolean("expenses_enabled").notNull().default(true),
  custody_reminders_enabled: boolean("custody_reminders_enabled").notNull().default(true),
  tone_coaching_enabled: boolean("tone_coaching_enabled").notNull().default(true),
  community_events_enabled: boolean("community_events_enabled").notNull().default(true),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_notification_preferences_user_id").on(table.user_id),
]);

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
  authentication_code: text("authentication_code").notNull().default(""),
  file_path: text("file_path").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_export_audit_log_family_id").on(table.family_id),
  index("idx_export_audit_log_user_id").on(table.user_id),
]);

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
}, (table) => [
  index("idx_custody_schedules_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_custody_swap_requests_family_id").on(table.family_id),
  index("idx_custody_swap_requests_schedule_id").on(table.schedule_id),
]);

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
}, (table) => [
  index("idx_professional_invites_family_id").on(table.family_id),
]);

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
}, (table) => [
  index("idx_professional_access_family_id").on(table.family_id),
  index("idx_professional_access_user_id").on(table.user_id),
]);

// ============================================================
// Phase 7: Photo Albums + Message Attachments
// ============================================================

export const photoAlbums = pgTable("photo_albums", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id"),
  title: text("title").notNull(),
  cover_photo_url: text("cover_photo_url"),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_photo_albums_family_id").on(table.family_id),
]);

export const photos = pgTable("photos", {
  id: text("id").primaryKey().$defaultFn(generateId),
  album_id: text("album_id").notNull(),
  family_id: text("family_id").notNull(),
  uploaded_by: text("uploaded_by").notNull(),
  file_url: text("file_url").notNull(),
  thumbnail_url: text("thumbnail_url"),
  caption: text("caption"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_photos_album_id").on(table.album_id),
  index("idx_photos_family_id").on(table.family_id),
]);

// ============================================================
// Phase 8: Child Info Bank
// ============================================================

export const childInfoEntries = pgTable("child_info_entries", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  category: text("category").notNull(),
  label: text("label").notNull(),
  value: text("value").notNull(),
  updated_by: text("updated_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_child_info_entries_family_id").on(table.family_id),
  index("idx_child_info_entries_child_id").on(table.child_id),
]);

// ============================================================
// Phase 9: Exchange Tracking
// ============================================================

export const exchangeRecords = pgTable("exchange_records", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  type: text("type").notNull(), // "dropoff" | "pickup"
  from_parent: text("from_parent").notNull(),
  to_parent: text("to_parent").notNull(),
  children: jsonb("children").$type<string[]>().notNull().default([]),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy").notNull(),
  address: text("address").notNull(),
  timestamp: text("timestamp").notNull(),
  status: text("status").notNull().default("ontime"), // "ontime" | "late" | "missed"
  notes: text("notes"),
  photo_url: text("photo_url"),
  recorded_by: text("recorded_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_exchange_records_family_id").on(table.family_id),
  index("idx_exchange_records_timestamp").on(table.timestamp),
]);

// ============================================================
// Phase 10: Private Journal
// ============================================================

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mood: text("mood"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  content_hash: text("content_hash").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_journal_entries_user_id").on(table.user_id),
  index("idx_journal_entries_created_at").on(table.created_at),
]);

// ============================================================
// Phase 11: Login/Session Audit Trail
// ============================================================

export const loginHistory = pgTable("login_history", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull(),
  event_type: text("event_type").notNull(),
  ip_address: text("ip_address"),
  user_agent: text("user_agent"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_login_history_user_id").on(table.user_id),
  index("idx_login_history_created_at").on(table.created_at),
]);

// ============================================================
// Phase 14: School System Integration (Norwegian)
// ============================================================

export const schoolConnections = pgTable("school_connections", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  platform: text("platform").notNull(), // "visma_flyt" | "itslearning" | "vigilo" | "manual"
  school_name: text("school_name").notNull(),
  municipality: text("municipality"),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  token_expires_at: text("token_expires_at"),
  external_student_id: text("external_student_id"),
  is_active: boolean("is_active").notNull().default(true),
  connected_by: text("connected_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_school_connections_family_id").on(table.family_id),
  index("idx_school_connections_child_id").on(table.child_id),
]);

export const schoolHomework = pgTable("school_homework", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  connection_id: text("connection_id").notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  description: text("description"),
  due_date: text("due_date").notNull(),
  status: text("status").notNull().default("assigned"),
  grade: text("grade"),
  max_grade: text("max_grade"),
  external_id: text("external_id"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_school_homework_family_id").on(table.family_id),
  index("idx_school_homework_child_id").on(table.child_id),
  index("idx_school_homework_due_date").on(table.due_date),
]);

export const schoolAttendance = pgTable("school_attendance", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  connection_id: text("connection_id").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(), // "present" | "absent" | "late" | "excused"
  subject: text("subject"),
  note: text("note"),
  external_id: text("external_id"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_school_attendance_family_id").on(table.family_id),
  index("idx_school_attendance_child_id").on(table.child_id),
  index("idx_school_attendance_date").on(table.date),
]);

export const schoolGrades = pgTable("school_grades", {
  id: text("id").primaryKey().$defaultFn(generateId),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  connection_id: text("connection_id").notNull(),
  subject: text("subject").notNull(),
  grade: text("grade").notNull(),
  max_grade: text("max_grade"),
  term: text("term"),
  date: text("date").notNull(),
  teacher_comment: text("teacher_comment"),
  external_id: text("external_id"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_school_grades_family_id").on(table.family_id),
  index("idx_school_grades_child_id").on(table.child_id),
]);

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
}, (table) => [
  index("idx_documents_family_id").on(table.family_id),
  index("idx_documents_uploaded_by").on(table.uploaded_by),
]);

// ============================================================
// Phase 15: Community Events & Carpooling
// ============================================================

export const communityEvents = pgTable("community_events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  source: text("source").notNull(), // "school" | "city" | "library" | "community_center" | "user_created"
  source_id: text("source_id"), // External event ID from school/city API
  source_name: text("source_name"), // Display name of the source
  family_id: text("family_id"), // If user-created, linked to family; otherwise null
  title: text("title").notNull(),
  description: text("description"),
  event_date: text("event_date").notNull(),
  event_time: text("event_time"),
  end_time: text("end_time"),
  location: text("location"),
  address: text("address"),
  city: text("city"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: text("category"),
  age_range_min: integer("age_range_min"),
  age_range_max: integer("age_range_max"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  image_url: text("image_url"),
  external_url: text("external_url"),
  price: text("price"),
  is_recurring: boolean("is_recurring").notNull().default(false),
  recurrence_pattern: text("recurrence_pattern"),
  recurrence_end_date: text("recurrence_end_date"),
  capacity: integer("capacity"),
  published_at: text("published_at").notNull().$defaultFn(nowIso),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_community_events_date").on(table.event_date),
  index("idx_community_events_category").on(table.category),
  index("idx_community_events_source").on(table.source),
  index("idx_community_events_family_id").on(table.family_id),
]);

export const eventAttendees = pgTable("event_attendees", {
  id: text("id").primaryKey().$defaultFn(generateId),
  event_id: text("event_id").notNull(),
  user_id: text("user_id").notNull(),
  family_id: text("family_id").notNull(),
  attending_children: jsonb("attending_children").$type<number[]>().notNull().default([]),
  status: text("status").notNull().default("going"),
  notes: text("notes"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_event_attendees_event_id").on(table.event_id),
  index("idx_event_attendees_user_id").on(table.user_id),
  index("idx_event_attendees_family_id").on(table.family_id),
]);

export const carpoolArrangements = pgTable("carpool_arrangements", {
  id: text("id").primaryKey().$defaultFn(generateId),
  event_id: text("event_id").notNull(),
  user_id: text("user_id").notNull(),
  family_id: text("family_id").notNull(),
  type: text("type").notNull(),
  capacity: integer("capacity"),
  children_transporting: jsonb("children_transporting").$type<number[]>().notNull().default([]),
  pickup_location: text("pickup_location"),
  pickup_latitude: real("pickup_latitude"),
  pickup_longitude: real("pickup_longitude"),
  pickup_time: text("pickup_time"),
  notes: text("notes"),
  status: text("status").notNull().default("open"),
  matched_with: text("matched_with"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_carpool_arrangements_event_id").on(table.event_id),
  index("idx_carpool_arrangements_user_id").on(table.user_id),
  index("idx_carpool_arrangements_family_id").on(table.family_id),
  index("idx_carpool_arrangements_status").on(table.status),
]);

export const eventNotifications = pgTable("event_notifications", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull(),
  event_id: text("event_id").notNull(),
  notification_type: text("notification_type").notNull(),
  scheduled_at: text("scheduled_at").notNull(),
  sent_at: text("sent_at"),
  status: text("status").notNull().default("pending"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_event_notifications_user_id").on(table.user_id),
  index("idx_event_notifications_scheduled_at").on(table.scheduled_at),
  index("idx_event_notifications_status").on(table.status),
]);

// ---------------------------------------------------------------------------
// Refresh Tokens — secure token rotation with family-based revocation
// ---------------------------------------------------------------------------

export const refreshTokens = pgTable("refresh_tokens", {
  id: text("id").primaryKey().$defaultFn(generateId),
  user_id: text("user_id").notNull(),
  token_hash: text("token_hash").notNull(),
  family_id: text("family_id").notNull(),
  device_info: text("device_info"),
  expires_at: text("expires_at").notNull(),
  revoked_at: text("revoked_at"),
  replaced_by: text("replaced_by"),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
}, (table) => [
  index("idx_refresh_tokens_user_id").on(table.user_id),
  index("idx_refresh_tokens_token_hash").on(table.token_hash),
  index("idx_refresh_tokens_family_id").on(table.family_id),
]);
