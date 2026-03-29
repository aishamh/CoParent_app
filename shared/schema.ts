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
  venmo_username: string | null;
  paypal_email: string | null;
  apple_user_identifier: string | null;
  created_at: string;
}

export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email().nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().nullable().optional(),
  role: z.string().default("parent_a"),
  apple_user_identifier: z.string().nullable().optional(),
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
  venmo_username: string | null;
  paypal_email: string | null;
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
  schedule_id: string | null;
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
export type MessageAttachmentType = "image" | "file";

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
  tone_score: string | null;
  tone_overridden: boolean;
  attachment_url: string | null;
  attachment_type: MessageAttachmentType | null;
  created_at: string;
}

export const insertMessageSchema = z.object({
  receiver_id: z.string().min(1),
  subject: z.string().max(200).nullable().optional(),
  content: z.string().min(1, "Message cannot be empty").max(10000),
  attachment_url: z.string().nullable().optional(),
  attachment_type: z.enum(["image", "file"]).nullable().optional(),
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

// ============================================================
// Phase 1: Push Notifications
// ============================================================

export interface DeviceToken {
  id: string;
  user_id: string;
  token: string;
  platform: string;
  is_active: boolean;
  created_at: string;
}

export const insertDeviceTokenSchema = z.object({
  token: z.string().min(1, "Device token is required"),
  platform: z.enum(["ios", "android"]).default("ios"),
});
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;

export interface NotificationPreferences {
  id: string;
  user_id: string;
  messages_enabled: boolean;
  calendar_enabled: boolean;
  expenses_enabled: boolean;
  custody_reminders_enabled: boolean;
  tone_coaching_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const updateNotificationPreferencesSchema = z.object({
  messages_enabled: z.boolean().optional(),
  calendar_enabled: z.boolean().optional(),
  expenses_enabled: z.boolean().optional(),
  custody_reminders_enabled: z.boolean().optional(),
  tone_coaching_enabled: z.boolean().optional(),
  community_events_enabled: z.boolean().optional(),
});
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;

// ============================================================
// Phase 2: PDF Export Engine
// ============================================================

export interface ExportAuditLog {
  id: string;
  family_id: string;
  user_id: string;
  export_type: string;
  date_range_start: string | null;
  date_range_end: string | null;
  record_count: number;
  document_hash: string;
  authentication_code: string;
  file_path: string;
  created_at: string;
}

export const createExportSchema = z.object({
  export_type: z.enum(["messages", "expenses", "calendar"]),
  date_range_start: z.string().min(1, "Start date is required"),
  date_range_end: z.string().min(1, "End date is required"),
});
export type CreateExport = z.infer<typeof createExportSchema>;

// ============================================================
// Phase 3: Custody Schedule Templates
// ============================================================

export type CustodyTemplateType =
  | "week_on_week_off"
  | "2_2_3"
  | "alternating_weekends"
  | "alternating_weekends_midweek"
  | "custom";

export interface CustodySchedule {
  id: string;
  family_id: string;
  child_id: number | null;
  template_type: CustodyTemplateType;
  start_date: string;
  parent_a_id: string;
  parent_b_id: string;
  custom_pattern: number[] | null;
  is_active: boolean;
  created_at: string;
}

export const insertCustodyScheduleSchema = z.object({
  child_id: z.number().nullable().optional(),
  template_type: z.enum([
    "week_on_week_off",
    "2_2_3",
    "alternating_weekends",
    "alternating_weekends_midweek",
    "custom",
  ]),
  start_date: z.string().min(1, "Start date is required"),
  parent_a_id: z.string().min(1),
  parent_b_id: z.string().min(1),
  custom_pattern: z.array(z.number()).nullable().optional(),
});
export type InsertCustodySchedule = z.infer<typeof insertCustodyScheduleSchema>;

export type SwapRequestStatus = "pending" | "approved" | "declined";

export interface CustodySwapRequest {
  id: string;
  family_id: string;
  schedule_id: string;
  requested_by: string;
  original_date: string;
  proposed_date: string;
  reason: string | null;
  status: SwapRequestStatus;
  responded_at: string | null;
  created_at: string;
}

export const insertSwapRequestSchema = z.object({
  schedule_id: z.string().min(1),
  original_date: z.string().min(1, "Original date is required"),
  proposed_date: z.string().min(1, "Proposed date is required"),
  reason: z.string().nullable().optional(),
});
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;

// ============================================================
// Phase 4: Tone Detection
// ============================================================

export type ToneLabel =
  | "neutral"
  | "friendly"
  | "formal"
  | "hostile"
  | "aggressive"
  | "passive_aggressive";

export interface ToneCheckResult {
  tone: ToneLabel;
  confidence: number;
  flagged: boolean;
  suggestion?: string;
  explanation?: string;
}

export const toneCheckRequestSchema = z.object({
  content: z.string().min(1, "Content is required"),
});
export type ToneCheckRequest = z.infer<typeof toneCheckRequestSchema>;

// ============================================================
// Phase 5: Attorney/Mediator Portals
// ============================================================

export type ProfessionalRole = "attorney" | "mediator";

export interface ProfessionalInvite {
  id: string;
  family_id: string;
  invite_code: string;
  role: ProfessionalRole;
  invited_by: string;
  email: string | null;
  expires_at: string;
  accepted_by: string | null;
  revoked: boolean;
  created_at: string;
}

export const createProfessionalInviteSchema = z.object({
  role: z.enum(["attorney", "mediator"]),
  email: z.string().email().nullable().optional(),
});
export type CreateProfessionalInvite = z.infer<typeof createProfessionalInviteSchema>;

export interface ProfessionalAccess {
  id: string;
  family_id: string;
  user_id: string;
  role: ProfessionalRole;
  granted_by: string;
  can_view_messages: boolean;
  can_view_calendar: boolean;
  can_view_expenses: boolean;
  can_view_documents: boolean;
  can_export: boolean;
  is_active: boolean;
  created_at: string;
}

export const updateProfessionalAccessSchema = z.object({
  can_view_messages: z.boolean().optional(),
  can_view_calendar: z.boolean().optional(),
  can_view_expenses: z.boolean().optional(),
  can_view_documents: z.boolean().optional(),
  can_export: z.boolean().optional(),
  is_active: z.boolean().optional(),
});
export type UpdateProfessionalAccess = z.infer<typeof updateProfessionalAccessSchema>;

// ============================================================
// Phase 6: Payment Integration
// ============================================================

export const updatePaymentInfoSchema = z.object({
  venmo_username: z.string().nullable().optional(),
  paypal_email: z.string().email().nullable().optional(),
});
export type UpdatePaymentInfo = z.infer<typeof updatePaymentInfoSchema>;

// ============================================================
// Custody Day Assignment (used by schedule preview)
// ============================================================

export interface CustodyDay {
  date: string;
  parent: "A" | "B";
}

// ============================================================
// Phase 7: Photo Albums
// ============================================================

export interface PhotoAlbum {
  id: string;
  family_id: string;
  child_id: number | null;
  title: string;
  cover_photo_url: string | null;
  created_by: string;
  created_at: string;
}

export const insertPhotoAlbumSchema = z.object({
  child_id: z.number().nullable().optional(),
  title: z.string().min(1, "Album title is required"),
});
export type InsertPhotoAlbum = z.infer<typeof insertPhotoAlbumSchema>;

export interface Photo {
  id: string;
  album_id: string;
  family_id: string;
  uploaded_by: string;
  file_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  created_at: string;
}

export const insertPhotoSchema = z.object({
  album_id: z.string().min(1, "Album ID is required"),
  caption: z.string().nullable().optional(),
});
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

// ============================================================
// Phase 8: Child Info Bank
// ============================================================

export type ChildInfoCategory =
  | "allergy"
  | "dietary"
  | "routine"
  | "preference"
  | "clothing"
  | "emergency_contact"
  | "important_date"
  | "note";

export interface ChildInfoEntry {
  id: string;
  family_id: string;
  child_id: number;
  category: ChildInfoCategory;
  label: string;
  value: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export const insertChildInfoEntrySchema = z.object({
  child_id: z.number().min(1, "Child is required"),
  category: z.enum([
    "allergy",
    "dietary",
    "routine",
    "preference",
    "clothing",
    "emergency_contact",
    "important_date",
    "note",
  ]),
  label: z.string().min(1, "Label is required").max(100),
  value: z.string().min(1, "Value is required").max(1000),
});
export type InsertChildInfoEntry = z.infer<typeof insertChildInfoEntrySchema>;

export const updateChildInfoEntrySchema = z.object({
  label: z.string().min(1).max(100).optional(),
  value: z.string().min(1).max(1000).optional(),
  category: z
    .enum([
      "allergy",
      "dietary",
      "routine",
      "preference",
      "clothing",
      "emergency_contact",
      "important_date",
      "note",
    ])
    .optional(),
});
export type UpdateChildInfoEntry = z.infer<typeof updateChildInfoEntrySchema>;

// ============================================================
// Phase 9: Exchange Tracking
// ============================================================

export type ExchangeType = "dropoff" | "pickup";
export type ExchangeStatus = "ontime" | "late" | "missed";

export interface ExchangeRecord {
  id: string;
  family_id: string;
  type: ExchangeType;
  from_parent: string;
  to_parent: string;
  children: string[];
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  timestamp: string;
  status: ExchangeStatus;
  notes: string | null;
  photo_url: string | null;
  recorded_by: string;
  created_at: string;
}

export const insertExchangeRecordSchema = z.object({
  type: z.enum(["dropoff", "pickup"]),
  from_parent: z.string().min(1),
  to_parent: z.string().min(1),
  children: z.array(z.string()).min(1, "Select at least one child"),
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
  address: z.string().min(1),
  timestamp: z.string().min(1),
  status: z.enum(["ontime", "late", "missed"]).default("ontime"),
  notes: z.string().nullable().optional(),
  photo_url: z.string().nullable().optional(),
});
export type InsertExchangeRecord = z.infer<typeof insertExchangeRecordSchema>;

// ============================================================
// Phase 10: Private Journal
// ============================================================

export type JournalMood = "positive" | "neutral" | "concerned" | "negative";

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood: JournalMood | null;
  tags: string[];
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export const insertJournalEntrySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required").max(10000),
  mood: z.enum(["positive", "neutral", "concerned", "negative"]).nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;

export const updateJournalEntrySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  mood: z.enum(["positive", "neutral", "concerned", "negative"]).nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
});
export type UpdateJournalEntry = z.infer<typeof updateJournalEntrySchema>;

// ============================================================
// Phase 11: Login/Session Audit Trail
// ============================================================

export type LoginEventType = "login" | "logout" | "login_failed" | "session_restored" | "password_changed";

export interface LoginHistoryEntry {
  id: string;
  user_id: string;
  event_type: LoginEventType;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================
// Phase 14: School System Integration (Norwegian)
// ============================================================

export type SchoolPlatform = "visma_flyt" | "itslearning" | "vigilo" | "manual";

export interface SchoolConnection {
  id: string;
  family_id: string;
  child_id: number;
  platform: SchoolPlatform;
  school_name: string;
  municipality: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  external_student_id: string | null;
  is_active: boolean;
  connected_by: string;
  created_at: string;
  updated_at: string;
}

export const insertSchoolConnectionSchema = z.object({
  child_id: z.number().min(1, "Child is required"),
  platform: z.enum(["visma_flyt", "itslearning", "vigilo", "manual"]),
  school_name: z.string().min(1, "School name is required").max(200),
  municipality: z.string().max(100).nullable().optional(),
});
export type InsertSchoolConnection = z.infer<typeof insertSchoolConnectionSchema>;

export type HomeworkStatus = "assigned" | "in_progress" | "submitted" | "graded" | "overdue";

export interface SchoolHomework {
  id: string;
  family_id: string;
  child_id: number;
  connection_id: string;
  title: string;
  subject: string;
  description: string | null;
  due_date: string;
  status: HomeworkStatus;
  grade: string | null;
  max_grade: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export const insertSchoolHomeworkSchema = z.object({
  child_id: z.number().min(1, "Child is required"),
  connection_id: z.string().min(1, "Connection is required"),
  title: z.string().min(1, "Title is required").max(300),
  subject: z.string().min(1, "Subject is required").max(100),
  description: z.string().max(2000).nullable().optional(),
  due_date: z.string().min(1, "Due date is required"),
  status: z.enum(["assigned", "in_progress", "submitted", "graded", "overdue"]).default("assigned"),
  grade: z.string().max(20).nullable().optional(),
  max_grade: z.string().max(20).nullable().optional(),
});
export type InsertSchoolHomework = z.infer<typeof insertSchoolHomeworkSchema>;

export const updateSchoolHomeworkSchema = z.object({
  status: z.enum(["assigned", "in_progress", "submitted", "graded", "overdue"]).optional(),
  grade: z.string().max(20).nullable().optional(),
});
export type UpdateSchoolHomework = z.infer<typeof updateSchoolHomeworkSchema>;

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface SchoolAttendance {
  id: string;
  family_id: string;
  child_id: number;
  connection_id: string;
  date: string;
  status: AttendanceStatus;
  subject: string | null;
  note: string | null;
  external_id: string | null;
  created_at: string;
}

export const insertSchoolAttendanceSchema = z.object({
  child_id: z.number().min(1),
  connection_id: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(["present", "absent", "late", "excused"]),
  subject: z.string().max(100).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});
export type InsertSchoolAttendance = z.infer<typeof insertSchoolAttendanceSchema>;

export interface SchoolGrade {
  id: string;
  family_id: string;
  child_id: number;
  connection_id: string;
  subject: string;
  grade: string;
  max_grade: string | null;
  term: string | null;
  date: string;
  teacher_comment: string | null;
  external_id: string | null;
  created_at: string;
}

export const insertSchoolGradeSchema = z.object({
  child_id: z.number().min(1),
  connection_id: z.string().min(1),
  subject: z.string().min(1).max(100),
  grade: z.string().min(1).max(20),
  max_grade: z.string().max(20).nullable().optional(),
  term: z.string().max(50).nullable().optional(),
  date: z.string().min(1),
  teacher_comment: z.string().max(1000).nullable().optional(),
});
export type InsertSchoolGrade = z.infer<typeof insertSchoolGradeSchema>;

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

// ============================================================
// Phase 15: Community Events & Carpooling
// ============================================================

export type CommunityEventSource = "school" | "city" | "library" | "community_center" | "user_created";
export type CommunityEventCategory = "sports" | "arts" | "education" | "social" | "outdoor" | "other";
export type AttendeeStatus = "going" | "interested" | "declined";
export type CarpoolType = "need_ride" | "offering_ride";
export type CarpoolStatus = "open" | "matched" | "completed" | "cancelled";
export type EventNotificationType = "7_days" | "3_days" | "1_day" | "same_day" | "interest_match";
export type EventNotificationStatus = "pending" | "sent" | "cancelled";

export interface CommunityEvent {
  id: string;
  source: CommunityEventSource;
  source_id: string | null;
  source_name: string | null;
  family_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  category: CommunityEventCategory | null;
  age_range_min: number | null;
  age_range_max: number | null;
  tags: string[];
  image_url: string | null;
  external_url: string | null;
  price: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
  capacity: number | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export const insertCommunityEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  event_date: z.string().min(1, "Event date is required"),
  event_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.enum(["sports", "arts", "education", "social", "outdoor", "other"]).nullable().optional(),
  age_range_min: z.number().nullable().optional(),
  age_range_max: z.number().nullable().optional(),
  tags: z.array(z.string()).default([]),
  image_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  price: z.string().nullable().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().nullable().optional(),
  recurrence_end_date: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
});
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;

export const updateCommunityEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  event_date: z.string().min(1).optional(),
  event_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  category: z.enum(["sports", "arts", "education", "social", "outdoor", "other"]).nullable().optional(),
  age_range_min: z.number().nullable().optional(),
  age_range_max: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  image_url: z.string().url().nullable().optional(),
  external_url: z.string().url().nullable().optional(),
  price: z.string().nullable().optional(),
  is_recurring: z.boolean().optional(),
  recurrence_pattern: z.string().nullable().optional(),
  recurrence_end_date: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
});
export type UpdateCommunityEvent = z.infer<typeof updateCommunityEventSchema>;

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  family_id: string;
  attending_children: number[];
  status: AttendeeStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const insertEventAttendeeSchema = z.object({

    attending_children: z.array(z.number()).default([]),
    status: z.enum(["going", "interested", "declined"]).default("going"),
    notes: z.string().nullable().optional(),
  });
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;

export const updateEventAttendeeSchema = z.object({
  attending_children: z.array(z.number()).optional(),
  status: z.enum(["going", "interested", "declined"]).optional(),
  notes: z.string().nullable().optional(),
});
export type UpdateEventAttendee = z.infer<typeof updateEventAttendeeSchema>;

export interface CarpoolArrangement {
  id: string;
  event_id: string;
  user_id: string;
  family_id: string;
  type: CarpoolType;
  capacity: number | null;
  children_transporting: number[];
  pickup_location: string | null;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  pickup_time: string | null;
  notes: string | null;
  status: CarpoolStatus;
  matched_with: string | null;
  created_at: string;
  updated_at: string;
}

export const insertCarpoolArrangementSchema = z.object({

    type: z.enum(["need_ride", "offering_ride"]),
  capacity: z.number().nullable().optional(),
  children_transporting: z.array(z.number()).default([]),
  pickup_location: z.string().nullable().optional(),
  pickup_latitude: z.number().nullable().optional(),
  pickup_longitude: z.number().nullable().optional(),
  pickup_time: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type InsertCarpoolArrangement = z.infer<typeof insertCarpoolArrangementSchema>;

export const updateCarpoolArrangementSchema = z.object({
  capacity: z.number().nullable().optional(),
  children_transporting: z.array(z.number()).optional(),
  pickup_location: z.string().nullable().optional(),
  pickup_latitude: z.number().nullable().optional(),
  pickup_longitude: z.number().nullable().optional(),
  pickup_time: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["open", "matched", "completed", "cancelled"]).optional(),
  matched_with: z.string().nullable().optional(),
});
export type UpdateCarpoolArrangement = z.infer<typeof updateCarpoolArrangementSchema>;

export interface EventNotification {
  id: string;
  user_id: string;
  event_id: string;
  notification_type: EventNotificationType;
  scheduled_at: string;
  sent_at: string | null;
  status: EventNotificationStatus;
  created_at: string;
}

export const insertEventNotificationSchema = z.object({
  event_id: z.string().min(1, "Event ID is required"),
  notification_type: z.enum(["7_days", "3_days", "1_day", "same_day", "interest_match"]),
  scheduled_at: z.string().min(1, "Scheduled time is required"),
});
export type InsertEventNotification = z.infer<typeof insertEventNotificationSchema>;
