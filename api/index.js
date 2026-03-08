var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-entry.ts
import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";

// server/routes.ts
import { createHash } from "crypto";
import multer from "multer";
import { put, del } from "@vercel/blob";

// server/tables.ts
var tables_exports = {};
__export(tables_exports, {
  activities: () => activities,
  children: () => children,
  documents: () => documents,
  events: () => events,
  expenses: () => expenses,
  families: () => families,
  friends: () => friends,
  handoverNotes: () => handoverNotes,
  messages: () => messages,
  readingList: () => readingList,
  schoolTasks: () => schoolTasks,
  socialEvents: () => socialEvents,
  users: () => users
});
import { pgTable, text, integer, serial, boolean, real, jsonb } from "drizzle-orm/pg-core";
import crypto from "crypto";
var generateId = () => crypto.randomUUID();
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
var families = pgTable("families", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  invite_code: text("invite_code").notNull(),
  created_by: text("created_by").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var users = pgTable("users", {
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
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var children = pgTable("children", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender"),
  interests: text("interests").notNull().default("[]"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var events = pgTable("events", {
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
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  age_range: text("age_range").notNull(),
  duration: text("duration").notNull(),
  image: text("image"),
  description: text("description").notNull(),
  season: text("season"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  avatar: text("avatar"),
  relation: text("relation").notNull(),
  kids: text("kids").notNull().default("[]"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var socialEvents = pgTable("social_events", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  location: text("location"),
  friend_id: integer("friend_id"),
  description: text("description"),
  rsvp_status: text("rsvp_status").notNull().default("pending"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var readingList = pgTable("reading_list", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  progress: integer("progress").notNull().default(0),
  assigned_to: text("assigned_to").notNull(),
  cover: text("cover"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var schoolTasks = pgTable("school_tasks", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  title: text("title").notNull(),
  due_date: text("due_date").notNull(),
  status: text("status").notNull().default("pending"),
  platform: text("platform"),
  description: text("description"),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var handoverNotes = pgTable("handover_notes", {
  id: serial("id").primaryKey(),
  family_id: text("family_id").notNull(),
  child_id: integer("child_id").notNull(),
  parent: text("parent").notNull(),
  message: text("message").notNull(),
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var expenses = pgTable("expenses", {
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
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var messages = pgTable("messages", {
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
  created_at: text("created_at").notNull().$defaultFn(nowIso)
});
var documents = pgTable("documents", {
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
  shared_with: jsonb("shared_with").$type().notNull().default([]),
  tags: jsonb("tags").$type().notNull().default([]),
  created_at: text("created_at").notNull().$defaultFn(nowIso),
  updated_at: text("updated_at").notNull().$defaultFn(nowIso)
});

// server/db.ts
import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
var db = drizzle(sql, { schema: tables_exports });

// server/storage.ts
import { eq, and, or, gte, lte, desc, count } from "drizzle-orm";
var DatabaseStorage = class {
  // Family methods
  async createFamily(name, createdBy) {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [family] = await db.insert(families).values({
      name,
      created_by: createdBy,
      invite_code: inviteCode
    }).returning();
    return family;
  }
  async getFamily(id) {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || void 0;
  }
  async getFamilyByInviteCode(code) {
    const [family] = await db.select().from(families).where(eq(families.invite_code, code));
    return family || void 0;
  }
  async joinFamily(userId, familyId) {
    const [updated] = await db.update(users).set({ family_id: familyId }).where(eq(users.id, userId)).returning();
    return updated || void 0;
  }
  // User methods
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getFamilyMembers(familyId) {
    return db.select().from(users).where(eq(users.family_id, familyId));
  }
  // Children methods
  async getChildren(familyId, pagination) {
    const condition = familyId ? eq(children.family_id, familyId) : void 0;
    const [countResult] = await db.select({ total: count() }).from(children).where(condition);
    let query = db.select().from(children).where(condition);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getChild(id) {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || void 0;
  }
  async createChild(child) {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }
  async updateChild(id, child) {
    const [updated] = await db.update(children).set(child).where(eq(children.id, id)).returning();
    return updated || void 0;
  }
  // Events methods
  async getEvents(familyId, childId, startDate, endDate, pagination) {
    const conditions = [];
    if (familyId) conditions.push(eq(events.family_id, familyId));
    if (childId) conditions.push(eq(events.child_id, childId));
    if (startDate) conditions.push(gte(events.start_date, startDate));
    if (endDate) conditions.push(lte(events.start_date, endDate));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(events).where(whereClause);
    let query = db.select().from(events).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getEvent(id) {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || void 0;
  }
  async createEvent(event) {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }
  async updateEvent(id, event) {
    const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return updated || void 0;
  }
  async deleteEvent(id) {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }
  // Activities methods
  async getActivities(season, pagination) {
    const condition = season ? eq(activities.season, season) : void 0;
    const [countResult] = await db.select({ total: count() }).from(activities).where(condition);
    let query = db.select().from(activities).where(condition);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getActivity(id) {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || void 0;
  }
  async createActivity(activity) {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }
  // Friends methods
  async getFriends(familyId, pagination) {
    const condition = familyId ? eq(friends.family_id, familyId) : void 0;
    const [countResult] = await db.select({ total: count() }).from(friends).where(condition);
    let query = db.select().from(friends).where(condition);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getFriend(id) {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend || void 0;
  }
  async createFriend(friend) {
    const [newFriend] = await db.insert(friends).values(friend).returning();
    return newFriend;
  }
  async updateFriend(id, friend) {
    const [updated] = await db.update(friends).set(friend).where(eq(friends.id, id)).returning();
    return updated || void 0;
  }
  // Social Events methods
  async getSocialEvents(familyId, pagination) {
    const condition = familyId ? eq(socialEvents.family_id, familyId) : void 0;
    const [countResult] = await db.select({ total: count() }).from(socialEvents).where(condition);
    let query = db.select().from(socialEvents).where(condition);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getSocialEvent(id) {
    const [event] = await db.select().from(socialEvents).where(eq(socialEvents.id, id));
    return event || void 0;
  }
  async createSocialEvent(event) {
    const [newEvent] = await db.insert(socialEvents).values(event).returning();
    return newEvent;
  }
  async updateSocialEvent(id, event) {
    const [updated] = await db.update(socialEvents).set(event).where(eq(socialEvents.id, id)).returning();
    return updated || void 0;
  }
  // Reading List methods
  async getReadingList(familyId, childId, pagination) {
    const conditions = [];
    if (familyId) conditions.push(eq(readingList.family_id, familyId));
    if (childId) conditions.push(eq(readingList.child_id, childId));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(readingList).where(whereClause);
    let query = db.select().from(readingList).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getReadingListItem(id) {
    const [item] = await db.select().from(readingList).where(eq(readingList.id, id));
    return item || void 0;
  }
  async createReadingListItem(item) {
    const [newItem] = await db.insert(readingList).values(item).returning();
    return newItem;
  }
  async updateReadingListItem(id, item) {
    const [updated] = await db.update(readingList).set(item).where(eq(readingList.id, id)).returning();
    return updated || void 0;
  }
  // School Tasks methods
  async getSchoolTasks(familyId, childId, pagination) {
    const conditions = [];
    if (familyId) conditions.push(eq(schoolTasks.family_id, familyId));
    if (childId) conditions.push(eq(schoolTasks.child_id, childId));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(schoolTasks).where(whereClause);
    let query = db.select().from(schoolTasks).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getSchoolTask(id) {
    const [task] = await db.select().from(schoolTasks).where(eq(schoolTasks.id, id));
    return task || void 0;
  }
  async createSchoolTask(task) {
    const [newTask] = await db.insert(schoolTasks).values(task).returning();
    return newTask;
  }
  async updateSchoolTask(id, task) {
    const [updated] = await db.update(schoolTasks).set(task).where(eq(schoolTasks.id, id)).returning();
    return updated || void 0;
  }
  // Handover Notes methods
  async getHandoverNotes(familyId, childId, pagination) {
    const conditions = [];
    if (familyId) conditions.push(eq(handoverNotes.family_id, familyId));
    if (childId) conditions.push(eq(handoverNotes.child_id, childId));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(handoverNotes).where(whereClause);
    let query = db.select().from(handoverNotes).orderBy(desc(handoverNotes.created_at)).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async createHandoverNote(note) {
    const [newNote] = await db.insert(handoverNotes).values(note).returning();
    return newNote;
  }
  // Expense methods
  async getExpenses(familyId, childId, status, pagination) {
    const conditions = [];
    if (familyId) conditions.push(eq(expenses.family_id, familyId));
    if (childId) conditions.push(eq(expenses.child_id, childId));
    if (status) conditions.push(eq(expenses.status, status));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(expenses).where(whereClause);
    let query = db.select().from(expenses).orderBy(desc(expenses.date)).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getExpense(id) {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || void 0;
  }
  async createExpense(expense) {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }
  async updateExpense(id, expense) {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated || void 0;
  }
  async deleteExpense(id) {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }
  // Message methods
  async getMessages(userId, otherUserId, pagination) {
    const whereClause = otherUserId ? or(
      and(eq(messages.sender_id, userId), eq(messages.receiver_id, otherUserId)),
      and(eq(messages.sender_id, otherUserId), eq(messages.receiver_id, userId))
    ) : or(eq(messages.receiver_id, userId), eq(messages.sender_id, userId));
    const [countResult] = await db.select({ total: count() }).from(messages).where(whereClause);
    let query = db.select().from(messages).orderBy(desc(messages.created_at)).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getMessage(id) {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || void 0;
  }
  async createMessage(message) {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }
  async markMessageAsRead(id) {
    const [updated] = await db.update(messages).set({ is_read: true, read_at: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(messages.id, id)).returning();
    return updated || void 0;
  }
  async getUnreadCount(userId) {
    const result = await db.select().from(messages).where(and(eq(messages.receiver_id, userId), eq(messages.is_read, false)));
    return result.length;
  }
  // Document methods
  async getDocuments(userId, category, childId, pagination) {
    const conditions = [];
    conditions.push(
      or(
        eq(documents.uploaded_by, userId),
        // This is a simplified check - in production you'd use SQL array contains
        eq(documents.uploaded_by, userId)
        // Placeholder - needs proper array contains check
      )
    );
    if (category) conditions.push(eq(documents.category, category));
    if (childId) conditions.push(eq(documents.child_id, childId));
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [countResult] = await db.select({ total: count() }).from(documents).where(whereClause);
    let query = db.select().from(documents).orderBy(desc(documents.created_at)).where(whereClause);
    if (pagination) {
      query = query.limit(pagination.limit).offset(pagination.offset);
    }
    const data = await query;
    return { data, total: countResult?.total ?? 0 };
  }
  async getDocument(id) {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || void 0;
  }
  async createDocument(document) {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }
  async updateDocument(id, document) {
    const [updated] = await db.update(documents).set({ ...document, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(documents.id, id)).returning();
    return updated || void 0;
  }
  async deleteDocument(id) {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }
  async shareDocument(id, userIds) {
    const [updated] = await db.update(documents).set({ shared_with: userIds, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).where(eq(documents.id, id)).returning();
    return updated || void 0;
  }
};
var storage = new DatabaseStorage();

// server/auth.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var SALT_ROUNDS = 10;
var JWT_EXPIRES_IN = "7d";
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required");
  }
  return secret;
}
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
function sanitizeUser(user) {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
function generateToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return req.cookies?.token || null;
}
async function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = payload.userId;
  const user = await storage.getUser(payload.userId);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }
  req.familyId = user.family_id;
  next();
}

// server/middleware/security.ts
var contentSecurityPolicy = (req, res, next) => {
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com https://picsum.photos",
    "font-src 'self' data:",
    "connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join("; ");
  res.setHeader("Content-Security-Policy", cspHeader);
  next();
};
var securityHeaders = (req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), microphone=(), camera=(), payment=()"
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
};
var rateLimitStore = /* @__PURE__ */ new Map();
var rateLimiter = (options) => {
  const { windowMs, maxRequests, message = "Too many requests, please try again later." } = options;
  return (req, res, next) => {
    if (process.env.NODE_ENV === "development" && process.env.RATE_LIMIT_DISABLED === "true") {
      return next();
    }
    const identifier = req.ip || "unknown";
    const currentTime = Date.now();
    Array.from(rateLimitStore.entries()).forEach(([key, value]) => {
      if (currentTime > value.resetTime) {
        rateLimitStore.delete(key);
      }
    });
    const record = rateLimitStore.get(identifier);
    if (!record) {
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: currentTime + windowMs
      });
      return next();
    }
    if (currentTime > record.resetTime) {
      record.count = 1;
      record.resetTime = currentTime + windowMs;
      return next();
    }
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - currentTime) / 1e3);
      res.setHeader("Retry-After", retryAfter.toString());
      return res.status(429).json({
        error: message,
        retryAfter
      });
    }
    record.count++;
    next();
  };
};
var authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 5,
  // 5 attempts per window
  message: "Too many authentication attempts, please try again later."
});
var apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 100
  // 100 requests per window
});
var generalRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 200
  // 200 requests per window
});
var requestSizeLimiter = (maxSize = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxSize) {
      return res.status(413).json({
        error: "Request entity too large",
        maxSize: `${maxSize / 1024 / 1024}MB`
      });
    }
    next();
  };
};
var sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === "string") {
      return obj.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj !== null && typeof obj === "object") {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  next();
};
var validateOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === "production" ? "https://co-parent-app-mu.vercel.app" : "http://localhost:5173,http://localhost:5000")).split(",");
  const isAllowed = allowedOrigins.some((allowed) => {
    return origin === allowed.trim() || allowed.trim() === "*";
  });
  if (!isAllowed) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.status(204).send();
  }
  next();
};
var errorHandler = (err, req, res, next) => {
  console.error("Error:", err);
  const isDevelopment = process.env.NODE_ENV === "development";
  res.status(res.statusCode !== 200 ? res.statusCode : 500).json({
    error: {
      message: err.message,
      ...isDevelopment && { stack: err.stack }
    }
  });
};
var applySecurityMiddleware = (app2) => {
  app2.use(securityHeaders);
  app2.use(contentSecurityPolicy);
  app2.use(validateOrigin);
  app2.use(generalRateLimiter);
  app2.use(requestSizeLimiter());
  app2.use(sanitizeInput);
};

// shared/schema.ts
import { z } from "zod";
var insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email().nullable().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  display_name: z.string().nullable().optional(),
  role: z.string().default("parent_a")
});
var loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required")
});
var insertChildSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.number().min(0).max(18),
  gender: z.string().nullable().optional(),
  interests: z.string().default("[]")
});
var insertEventSchema = z.object({
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
  postal_code: z.string().nullable().optional()
});
var insertActivitySchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1),
  age_range: z.string().min(1),
  duration: z.string().min(1),
  image: z.string().nullable().optional(),
  description: z.string().min(1),
  season: z.string().nullable().optional()
});
var insertFriendSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable().optional(),
  avatar: z.string().nullable().optional(),
  relation: z.string().min(1),
  kids: z.string().default("[]")
});
var insertSocialEventSchema = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  location: z.string().nullable().optional(),
  friend_id: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  rsvp_status: z.enum(["pending", "accepted", "declined"]).default("pending")
});
var insertReadingListSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  author: z.string().min(1),
  progress: z.number().min(0).max(100).default(0),
  assigned_to: z.string().min(1),
  cover: z.string().nullable().optional()
});
var insertSchoolTaskSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  due_date: z.string().min(1),
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  platform: z.string().nullable().optional(),
  description: z.string().nullable().optional()
});
var insertHandoverNoteSchema = z.object({
  child_id: z.number(),
  parent: z.string().min(1),
  message: z.string().min(1)
});
var insertExpenseSchema = z.object({
  child_id: z.number(),
  title: z.string().min(1),
  amount: z.number().min(0),
  category: z.enum(["medical", "education", "activities", "clothing", "food", "transport", "other"]),
  paid_by: z.string().min(1),
  split_percentage: z.number().min(0).max(100).default(50),
  date: z.string().min(1),
  receipt: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "reimbursed"]).default("pending"),
  notes: z.string().nullable().optional()
});
var insertMessageSchema = z.object({
  receiver_id: z.string().min(1),
  subject: z.string().nullable().optional(),
  content: z.string().min(1, "Message cannot be empty")
});
var insertDocumentSchema = z.object({
  child_id: z.number().nullable().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.enum(["medical", "legal", "receipt", "school", "court", "other"]),
  tags: z.array(z.string()).default([])
});

// server/data/activities.ts
var DRAMMEN_ACTIVITIES = [
  {
    id: "leos-lekeland-drammen",
    name: "Leo's Lekeland Drammen",
    category: "play",
    rating: 4.3,
    reviewCount: 876,
    description: "Indoor play center with trampolines, ball pits, climbing walls, and slides for children aged 1-12. Separate toddler area and cafe for parents.",
    priceLevel: 2,
    ageRange: "1-12 years",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Engene 1, 3015 Drammen",
    city: "Drammen",
    latitude: 59.7374,
    longitude: 10.2143,
    tags: ["Indoor", "Trampolines", "Ball Pit", "Climbing"],
    website: "https://leoslekeland.no/drammen",
    imageUrl: "https://cms.leosplay.com/wp-content/uploads/2023/12/playcenter-family.jpg"
  },
  {
    id: "rush-trampolinepark-drammen",
    name: "Rush Trampolinepark Drammen",
    category: "play",
    rating: 4.4,
    reviewCount: 1023,
    description: "High-energy trampoline park with foam pits, dodgeball courts, slam-dunk zones, and a ninja warrior course for all ages.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Mon-Fri 10:00-20:00, Sat-Sun 10:00-18:00",
    address: "Kobbervikdalen, 3036 Drammen",
    city: "Drammen",
    latitude: 59.752456,
    longitude: 10.1302872,
    tags: ["Indoor", "Trampolines", "Ninja Course", "Foam Pit"],
    website: "https://rushtrampoline.no",
    imageUrl: "https://www.rushtrampolinepark.no/wp-content/uploads/2025/01/IMG_5498-1-768x512-1.webp"
  },
  {
    id: "kino-city-drammen",
    name: "Kino City Drammen",
    category: "cinema",
    rating: 4.2,
    reviewCount: 1450,
    description: "Modern multi-screen cinema in Drammen city center showing the latest family films, blockbusters, and Norwegian children's movies.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Daily 11:00-23:00",
    address: "Bragernes Torg 2A, 3017 Drammen",
    city: "Drammen",
    latitude: 59.743997,
    longitude: 10.203385,
    tags: ["Family Movies", "Kids Screenings", "3D"],
    website: "https://www.drammen-kino.no",
    imageUrl: "https://www.nfkino.no/sites/nfkino.no/files/media-images/2022-12/Drammen%201440x900_0.png"
  },
  {
    id: "drammens-museum",
    name: "Drammens Museum",
    category: "museum",
    rating: 4.1,
    reviewCount: 534,
    description: "Regional museum and gallery showcasing local art, history, and rotating exhibitions. Beautiful manor house grounds with seasonal family activities.",
    priceLevel: 1,
    ageRange: "4+ years",
    hours: "Tue-Sun 11:00-16:00",
    address: "Konnerudgata 7, 3045 Drammen",
    city: "Drammen",
    latitude: 59.7380969,
    longitude: 10.197178,
    tags: ["Art", "History", "Garden", "Exhibitions"],
    website: "https://drfrm.no",
    imageUrl: "https://drammens.museum.no/wp-content/uploads/2021/01/Marienlyst_4.jpg"
  },
  {
    id: "spiralen-drammen",
    name: "Spiralen",
    category: "outdoor",
    rating: 4.6,
    reviewCount: 2340,
    description: "Famous spiral tunnel road rising to a panoramic viewpoint above Drammen. Playground and picnic area at the summit with breathtaking fjord views.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours (tunnel may close in winter)",
    address: "Spiraltoppen, 3016 Drammen",
    city: "Drammen",
    latitude: 59.7510965,
    longitude: 10.1978895,
    tags: ["Free", "Viewpoint", "Playground", "Hiking"],
    website: "https://www.drammen.kommune.no",
    imageUrl: "https://www.drammen.kommune.no/globalassets/aktuelt/bilder/2020/1.-kvartal/spiralen-vinter.jpg"
  },
  {
    id: "klatreverket-drammen",
    name: "Klatreverket Drammen",
    category: "sports",
    rating: 4.5,
    reviewCount: 612,
    description: "Indoor climbing center with bouldering walls for all skill levels. Kids' climbing area, introductory courses, and a cozy cafe.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Mon-Fri 10:00-22:00, Sat-Sun 10:00-20:00",
    address: "Havnegata 20, 3012 Drammen",
    city: "Drammen",
    latitude: 59.7306049,
    longitude: 10.2234672,
    tags: ["Climbing", "Bouldering", "Kids Course", "Indoor"],
    website: "https://klatreverket.no",
    imageUrl: "https://klatreverketdrammen.no/wp-content/uploads/2023/09/IMG_7346_R-1-1024x683.jpg"
  },
  {
    id: "drammenbadet",
    name: "Drammenbadet",
    category: "swimming",
    rating: 4.3,
    reviewCount: 1890,
    description: "Modern swimming center with kids' pools, water slides, wave pool, diving boards, and a wellness area. Perfect family day out.",
    priceLevel: 2,
    ageRange: "All ages",
    hours: "Mon-Fri 06:00-21:00, Sat-Sun 09:00-19:00",
    address: "Bjoernstjerne Bjoernsons gate 44, 3044 Drammen",
    city: "Drammen",
    latitude: 59.7388,
    longitude: 10.2155,
    tags: ["Water Slides", "Wave Pool", "Kids Pool", "Diving"],
    website: "https://drammenbadet.no",
    imageUrl: "https://cdn.sanity.io/images/jlrwvnbf/commercial/3d74c56080c14b1f6890f71f48a201a5f43684d4-1600x837.jpg"
  },
  {
    id: "bragernes-torg-park",
    name: "Bragernes Torg & Park",
    category: "outdoor",
    rating: 4.4,
    reviewCount: 1120,
    description: "Drammen's central square and surrounding park area with fountains, green lawns, playground, and seasonal events. Great for picnics and strolls.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours",
    address: "Bragernes Torg, 3017 Drammen",
    city: "Drammen",
    latitude: 59.7443,
    longitude: 10.203,
    tags: ["Free", "Park", "Playground", "Central"],
    imageUrl: "https://www.drammen.no/imageresizer/?image=%2Fdmsimgs%2FF1325D4E14E9D633587E86C50F13B3953BAC7D07.jpg&action=ProductDetailProElite"
  },
  {
    id: "union-scene-drammen",
    name: "Union Scene",
    category: "arts",
    rating: 4.2,
    reviewCount: 478,
    description: "Cultural venue in a converted paper factory hosting concerts, theater, kids' shows, and art exhibitions throughout the year.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Event-dependent, box office Mon-Fri 10:00-16:00",
    address: "Groenland 60, 3045 Drammen",
    city: "Drammen",
    latitude: 59.744113,
    longitude: 10.192771,
    tags: ["Theater", "Concerts", "Kids Shows", "Art"],
    website: "https://unionscene.no",
    imageUrl: "https://www.unionscene.no/wp-content/uploads/2024/04/IMG_0406-edited-scaled.jpg"
  },
  {
    id: "drammens-teater",
    name: "Drammens Teater",
    category: "arts",
    rating: 4.3,
    reviewCount: 720,
    description: "Historic theater offering children's performances, musicals, and family shows in an elegant 19th-century building.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Performance days, box office Mon-Fri 12:00-17:00",
    address: "Bragernes Torg 8, 3017 Drammen",
    city: "Drammen",
    latitude: 59.7445869,
    longitude: 10.200442,
    tags: ["Theater", "Musicals", "Children's Shows", "Historic"],
    website: "https://drammensteater.no",
    imageUrl: "https://www.drammenscener.no/wp-content/uploads/2025/03/IMG_9226-scaled.jpg"
  },
  {
    id: "lier-bygdetun",
    name: "Lier Bygdetun",
    category: "museum",
    rating: 4,
    reviewCount: 245,
    description: "Open-air museum in Lier near Drammen featuring traditional Norwegian farm buildings, seasonal craft activities, and nature trails.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "May-Sep: Tue-Sun 11:00-16:00",
    address: "Lierstranda, 3400 Lier",
    city: "Lier",
    latitude: 59.799101,
    longitude: 10.257911,
    tags: ["Open-Air", "History", "Nature", "Crafts"],
    imageUrl: "https://lier-bygdetun.no/uploads/gLkEwyz2/768x0_640x0/Stabburet-og-Heg-i-hstfarger-Foto-Svein-Raste.jpg"
  },
  {
    id: "drammen-aktivitetspark",
    name: "Drammen Aktivitetspark",
    category: "outdoor",
    rating: 4.5,
    reviewCount: 680,
    description: "Outdoor activity park with climbing structures, skateboard ramps, zip line, and obstacle courses for children and teenagers.",
    priceLevel: 0,
    ageRange: "5+ years",
    hours: "Open 24 hours (daylight recommended)",
    address: "Marienlyst, 3015 Drammen",
    city: "Drammen",
    latitude: 59.735,
    longitude: 10.208,
    tags: ["Free", "Climbing", "Skateboard", "Zip Line"],
    imageUrl: "https://images.squarespace-cdn.com/content/v1/5f3138761b5ab209909e5034/1601976510816-92ZG44P1GT2SAV0HBVBQ/Drammen+aktivitetspark+Drone+2.jpg"
  }
];
var ASKER_BAERUM_ACTIVITIES = [
  {
    id: "henie-onstad-kunstsenter",
    name: "Henie Onstad Kunstsenter",
    category: "arts",
    rating: 4.4,
    reviewCount: 1560,
    description: "International art center on the Hoevikodden peninsula with contemporary exhibitions, sculpture park, family workshops, and fjord views.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Tue-Sun 11:00-17:00 (Thu until 20:00)",
    address: "Sonja Henies vei 31, 1311 Hoevikodden",
    city: "Baerum",
    latitude: 59.8889,
    longitude: 10.5541,
    tags: ["Art", "Sculpture Park", "Family Workshops", "Fjord Views"],
    website: "https://hok.no",
    imageUrl: "https://henie-onstad.imgix.net/Arkitektur-og-design/Hok_68_fotoleif-\xF8rnelund@2x.jpg?auto=compress%2Cformat&crop=focalpoint&fit=crop&fp-x=0.5&fp-y=0.5&h=630&q=82&w=1200"
  },
  {
    id: "baerums-verk",
    name: "Baerums Verk",
    category: "museum",
    rating: 4.3,
    reviewCount: 890,
    description: "Historic ironworks village with artisan shops, restaurants, and a museum. Charming cobblestone streets and seasonal craft markets.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Shops Mon-Sat 10:00-17:00, Sun 12:00-16:00",
    address: "Verksgata 15, 1353 Baerums Verk",
    city: "Baerum",
    latitude: 59.909,
    longitude: 10.502,
    tags: ["Historic", "Shopping", "Craft Markets", "Restaurants"],
    website: "https://baerumsverk.no",
    imageUrl: "https://tellusdmsmedia.newmindmedia.com/wsimgs/49773659-CFC1-43C0-AD21-137E81347AF1_B_rums_Verk_1727924972.jpeg"
  }
];
var OSLO_ACTIVITIES = [
  {
    id: "leo-lekeland",
    name: "Leo's Lekeland Fornebu",
    category: "play",
    rating: 4.3,
    reviewCount: 1247,
    description: "Norway's largest indoor play center with trampolines, climbing walls, ball pits, and slides. Includes a toddler zone and cafe for parents.",
    priceLevel: 2,
    ageRange: "1-12 years",
    hours: "Mon-Fri 10:00-18:00, Sat-Sun 10:00-19:00",
    address: "Snaroyveien 36, 1364 Fornebu",
    city: "Oslo",
    latitude: 59.895,
    longitude: 10.61,
    tags: ["Indoor", "Trampolines", "Birthday Parties"],
    website: "https://leoslekeland.no",
    imageUrl: "https://cms.leosplay.com/wp-content/uploads/2023/12/ballcanons.jpg"
  },
  {
    id: "tusenfryd",
    name: "TusenFryd",
    category: "amusement",
    rating: 4.1,
    reviewCount: 3589,
    description: "Norway's premier amusement park with roller coasters, water rides, and family attractions. Home to SpinSpider and the BadeFryd water park.",
    priceLevel: 3,
    ageRange: "All ages",
    hours: "May-Oct, 10:00-20:00 (varies)",
    address: "Vinterbrovegen 25, 1407 Vinterbro",
    city: "Oslo",
    latitude: 59.72,
    longitude: 10.78,
    tags: ["Roller Coasters", "Water Park", "Seasonal"],
    website: "https://tusenfryd.no",
    imageUrl: "https://www.tusenfryd.no/content/dam/tus/images/home/home-Attractions-fall2023.jpg.jpg"
  },
  {
    id: "oslo-kino",
    name: "Oslo Kino - Colosseum",
    category: "cinema",
    rating: 4.5,
    reviewCount: 2890,
    description: "Oslo's iconic cinema at Colosseum, one of Europe's largest theaters. Regular family matinees, kids' film festivals, and comfortable seating.",
    priceLevel: 1,
    ageRange: "3+ years",
    hours: "Daily 10:00-23:00",
    address: "Fridtjof Nansens vei 6, 0369 Oslo",
    city: "Oslo",
    latitude: 59.927,
    longitude: 10.722,
    tags: ["Family Movies", "3D", "Candy Bar"],
    website: "https://oslokino.no",
    imageUrl: "https://www.nfkino.no/sites/nfkino.no/files/media-images/2020-01/TinaRekdal_Colosseum-2.jpg"
  },
  {
    id: "teknisk-museum",
    name: "Norsk Teknisk Museum",
    category: "museum",
    rating: 4.5,
    reviewCount: 2134,
    description: "Norway's national museum of science and technology. Hands-on exhibits, interactive science labs, and the Teknoteket maker space.",
    priceLevel: 2,
    ageRange: "4+ years",
    hours: "Tue-Sun 10:00-18:00 (Wed until 20:00)",
    address: "Kjelsasveien 143, 0491 Oslo",
    city: "Oslo",
    latitude: 59.953,
    longitude: 10.779,
    tags: ["Science", "Interactive", "Maker Space"],
    website: "https://tekniskmuseum.no",
    imageUrl: "https://www.tekniskmuseum.no/images/vitensenter/2024-sommer_GormGaare (49).jpg"
  },
  {
    id: "frognerparken",
    name: "Frognerparken & Vigelandsanlegget",
    category: "outdoor",
    rating: 4.7,
    reviewCount: 5672,
    description: "Oslo's largest park with over 200 Vigeland sculptures, sprawling lawns, playgrounds, splash pads in summer, and ice skating in winter.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Open 24 hours, Playground 07:00-21:00",
    address: "Nobels gate 32, 0268 Oslo",
    city: "Oslo",
    latitude: 59.9272,
    longitude: 10.701,
    tags: ["Free", "Sculptures", "Playground"],
    imageUrl: "https://www.frognerparken.no/wp-content/uploads/2025/10/d6a051098f8400822021b7de82f9336b71e69e30.jpg"
  },
  {
    id: "barnas-kulturhus",
    name: "Barnas Kulturhus",
    category: "arts",
    rating: 4.6,
    reviewCount: 876,
    description: "Vibrant cultural center for children with theater performances, art workshops, music classes, and interactive exhibitions.",
    priceLevel: 1,
    ageRange: "2-10 years",
    hours: "Tue-Sun 10:00-16:00",
    address: "Schweigaards gate 14, 0185 Oslo",
    city: "Oslo",
    latitude: 59.911,
    longitude: 10.761,
    tags: ["Theater", "Art Workshops", "Music"],
    imageUrl: "https://barnekunst.no/wp-content/uploads/2023/01/Anton.Antonov.Russia.web_.jpg"
  },
  {
    id: "holmenkollen",
    name: "Holmenkollen Ski Museum & Jump",
    category: "sports",
    rating: 4.4,
    reviewCount: 3102,
    description: "The legendary ski jump and world's oldest ski museum. Includes a zipline from the top with panoramic views of the Oslo fjord.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Daily 10:00-17:00 (May-Sep until 20:00)",
    address: "Kongeveien 5, 0787 Oslo",
    city: "Oslo",
    latitude: 59.964,
    longitude: 10.667,
    tags: ["Ski Jump", "Zipline", "Museum"],
    website: "https://holmenkollen.com",
    imageUrl: "https://holmenkollen.com/wp-content/uploads/2025/11/Thomas-Ekstrom_Skimuseet_MG_7249_WEB-1024x683.jpg"
  },
  {
    id: "sorenga-sjobad",
    name: "Sorenga Sjobad",
    category: "swimming",
    rating: 4.2,
    reviewCount: 1034,
    description: "Oslo's urban seawater pool complex at the waterfront. Children's pool, diving boards, floating saunas, and stunning fjord views.",
    priceLevel: 0,
    ageRange: "All ages",
    hours: "Jun-Aug, 07:00-21:00",
    address: "Sorenga 1, 0194 Oslo",
    city: "Oslo",
    latitude: 59.904,
    longitude: 10.752,
    tags: ["Outdoor Pool", "Diving", "Fjord Views"],
    imageUrl: "https://images.adsttc.com/media/images/58d4/e3bd/e58e/ce81/8b00/017b/large_jpg/S%C3%B8renga_Utvikling_2895.jpg?1490346933"
  },
  {
    id: "munch-museum",
    name: "MUNCH Museum",
    category: "museum",
    rating: 4.3,
    reviewCount: 1789,
    description: "Striking waterfront museum with Edvard Munch's masterpieces. Family art workshops on weekends, kids' guided tours, and digital experiences.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Tue-Sun 10:00-18:00 (Thu-Sat until 21:00)",
    address: "Edvard Munchs plass 1, 0194 Oslo",
    city: "Oslo",
    latitude: 59.906,
    longitude: 10.754,
    tags: ["Art", "Kids Workshops", "Architecture"],
    website: "https://munch.no",
    imageUrl: "https://www.munch.no/globalassets/foto-munch/eksterior/ik_munch_summer_2025_ext_0021.jpg"
  },
  {
    id: "oslo-vinterpark",
    name: "Oslo Vinterpark (Tryvann)",
    category: "sports",
    rating: 4,
    reviewCount: 1456,
    description: "Oslo's closest alpine ski resort with slopes for all levels, children's area with magic carpet lifts, and ski school.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Winter: Mon-Fri 10:00-21:00, Sat-Sun 09:30-17:00",
    address: "Tryvannsveien 64, 0791 Oslo",
    city: "Oslo",
    latitude: 59.983,
    longitude: 10.668,
    tags: ["Skiing", "Kids Slopes", "Ski School"],
    website: "https://oslovinterpark.no",
    imageUrl: "https://www.skiresort.info/fileadmin/_processed_/28/8e/e5/5b/9a7a2ec976.jpg"
  },
  {
    id: "barnekunstmuseet",
    name: "Internasjonalt Barnekunstmuseum",
    category: "arts",
    rating: 4.1,
    reviewCount: 423,
    description: "The world's only museum dedicated entirely to art created by children. Rotating exhibits, creative workshops, and a global perspective.",
    priceLevel: 1,
    ageRange: "3-15 years",
    hours: "Tue-Sun 11:00-16:00",
    address: "Lille Frens vei 4, 0369 Oslo",
    city: "Oslo",
    latitude: 59.927,
    longitude: 10.715,
    tags: ["Children's Art", "Workshops", "Global"],
    imageUrl: "https://barnekunst.no/wp-content/uploads/2023/01/barnekunst-ukraina-330x330px.jpg"
  },
  {
    id: "oslo-reptilpark",
    name: "Oslo Reptilpark",
    category: "museum",
    rating: 4.2,
    reviewCount: 987,
    description: "Home to over 100 species of reptiles, amphibians, and insects. Interactive feeding sessions and educational talks for children.",
    priceLevel: 2,
    ageRange: "3+ years",
    hours: "Daily 10:00-18:00",
    address: "St. Halvards gate 1, 0192 Oslo",
    city: "Oslo",
    latitude: 59.909,
    longitude: 10.766,
    tags: ["Animals", "Interactive", "Educational"],
    imageUrl: "https://media.izi.travel/cd9b44b4-d2c6-4ee4-a3ea-9296c8916cff/109f60bd-8d50-401b-a2b1-f8fa2d503a6d_800x600.jpg"
  },
  {
    id: "oslo-klatrepark",
    name: "Oslo Klatrepark",
    category: "outdoor",
    rating: 4.5,
    reviewCount: 1523,
    description: "Treetop adventure park with climbing courses for all ages and skill levels. Zip lines, rope bridges, and Tarzan swings in the forest.",
    priceLevel: 2,
    ageRange: "5+ years",
    hours: "Apr-Oct, 10:00-18:00 (weekends until 19:00)",
    address: "Sognsvannsvn. 75, 0863 Oslo",
    city: "Oslo",
    latitude: 59.966,
    longitude: 10.73,
    tags: ["Climbing", "Zip Line", "Outdoor"],
    imageUrl: "https://cdn.prod.website-files.com/6037cb15c9bb0d0fa66c51c3/6037cd3c907bb23fb89fe6c1_1920.jpg"
  },
  {
    id: "bogstad-swimming",
    name: "Bogstad Camping & Bad",
    category: "swimming",
    rating: 4,
    reviewCount: 634,
    description: "Family-friendly lake swimming with sandy beach, water slide, and canoe rental. Beautiful forest setting near Bogstadvannet lake.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Jun-Aug, 09:00-20:00",
    address: "Ankerveien 117, 0766 Oslo",
    city: "Oslo",
    latitude: 59.965,
    longitude: 10.649,
    tags: ["Lake", "Beach", "Canoe Rental"],
    imageUrl: "https://i1.vrs.gd/topcamp/uploads/dam/images-20/20250515041922/bogstad_oppleve_bogstadvannet.jpg"
  },
  {
    id: "deichman-toyen",
    name: "Deichman Toyen (Kids Section)",
    category: "arts",
    rating: 4.6,
    reviewCount: 512,
    description: "Award-winning public library with a fantastic children's section. Story time, maker workshops, gaming area, and free activities year-round.",
    priceLevel: 0,
    ageRange: "0-15 years",
    hours: "Mon-Fri 08:00-19:00, Sat 10:00-16:00",
    address: "Hagegata 22, 0653 Oslo",
    city: "Oslo",
    latitude: 59.915,
    longitude: 10.771,
    tags: ["Free", "Library", "Workshops"],
    imageUrl: "https://www.includi.com/wp-content/uploads/2024/02/BIBLO-1-1920x1800.jpg"
  },
  {
    id: "salt-art-music",
    name: "SALT Art & Music",
    category: "outdoor",
    rating: 4.3,
    reviewCount: 892,
    description: "Nomadic art village on the Oslo waterfront. Family concerts, art installations, saunas, and seasonal cultural events in a unique setting.",
    priceLevel: 1,
    ageRange: "All ages",
    hours: "Daily 11:00-23:00 (seasonal)",
    address: "Langkaia 1, 0150 Oslo",
    city: "Oslo",
    latitude: 59.908,
    longitude: 10.748,
    tags: ["Art", "Music", "Waterfront"],
    imageUrl: "https://images.squarespace-cdn.com/content/v1/5b30020796d45595ed164534/96c4217c-2c0a-4617-8219-58e0038cac71/Hero+bilde+SALT+Art%26Music.png"
  },
  {
    id: "oslo-filmfestival-kids",
    name: "Oslo Kino - Ringen",
    category: "cinema",
    rating: 4.2,
    reviewCount: 756,
    description: "Modern cinema in Gruenerlokka with dedicated kids' screenings, baby-friendly showings, and a cozy family lounge area.",
    priceLevel: 1,
    ageRange: "0+ years",
    hours: "Daily 10:00-22:00",
    address: "Thorvald Meyers gate 82, 0552 Oslo",
    city: "Oslo",
    latitude: 59.925,
    longitude: 10.759,
    tags: ["Baby Cinema", "Kids Screenings", "Lounge"],
    imageUrl: "https://www.nfkino.no/sites/nfkino.no/files/media-images/2019-11/TinaRekdal_Ringen-65.jpg"
  }
];
var ALL_ACTIVITIES = [
  ...DRAMMEN_ACTIVITIES,
  ...ASKER_BAERUM_ACTIVITIES,
  ...OSLO_ACTIVITIES
];

// server/services/overpassApi.ts
var OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
var OVERPASS_TIMEOUT_SECONDS = 20;
var CLIENT_TIMEOUT_MS = 2e4;
var MAX_OSM_RESULTS = 60;
var OSM_TAG_MAPPINGS = [
  // Cinema
  { osmKey: "amenity", osmValue: "cinema", category: "cinema", label: "Cinema", includeWays: true },
  // Amusement
  { osmKey: "tourism", osmValue: "theme_park", category: "amusement", label: "Theme Park", includeWays: true },
  { osmKey: "leisure", osmValue: "amusement_arcade", category: "amusement", label: "Arcade" },
  // Play — playgrounds are almost always nodes; skip ways for speed
  { osmKey: "leisure", osmValue: "playground", category: "play", label: "Playground" },
  // Museum
  { osmKey: "tourism", osmValue: "museum", category: "museum", label: "Museum", includeWays: true },
  { osmKey: "tourism", osmValue: "zoo", category: "museum", label: "Zoo", includeWays: true },
  { osmKey: "tourism", osmValue: "aquarium", category: "museum", label: "Aquarium", includeWays: true },
  // Outdoor — skip park ways (too many large polygons) and nature reserves
  { osmKey: "tourism", osmValue: "viewpoint", category: "outdoor", label: "Viewpoint" },
  { osmKey: "leisure", osmValue: "garden", category: "outdoor", label: "Garden" },
  // Sports
  { osmKey: "leisure", osmValue: "sports_centre", category: "sports", label: "Sports Centre", includeWays: true },
  { osmKey: "leisure", osmValue: "ice_rink", category: "sports", label: "Ice Rink" },
  { osmKey: "leisure", osmValue: "bowling_alley", category: "sports", label: "Bowling" },
  // Arts
  { osmKey: "amenity", osmValue: "theatre", category: "arts", label: "Theatre", includeWays: true },
  { osmKey: "amenity", osmValue: "arts_centre", category: "arts", label: "Arts Centre" },
  { osmKey: "amenity", osmValue: "library", category: "arts", label: "Library", includeWays: true },
  // Swimming
  { osmKey: "leisure", osmValue: "swimming_pool", category: "swimming", label: "Swimming Pool" },
  { osmKey: "leisure", osmValue: "water_park", category: "swimming", label: "Water Park", includeWays: true }
];
function radiusToBbox(lat, lng, radiusMeters) {
  const radiusKm = radiusMeters / 1e3;
  const latOffset = radiusKm / 111.32;
  const lngOffset = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180));
  return {
    south: lat - latOffset,
    west: lng - lngOffset,
    north: lat + latOffset,
    east: lng + lngOffset
  };
}
function buildOverpassQuery(lat, lng, radiusMeters, categoryFilter) {
  const mappings = categoryFilter ? OSM_TAG_MAPPINGS.filter((m) => m.category === categoryFilter) : OSM_TAG_MAPPINGS;
  if (mappings.length === 0) return "";
  const { south, west, north, east } = radiusToBbox(lat, lng, radiusMeters);
  const bbox = `${south},${west},${north},${east}`;
  const queries = [];
  for (const m of mappings) {
    queries.push(
      `  node["${m.osmKey}"="${m.osmValue}"]["name"](${bbox});`
    );
    if (m.includeWays) {
      queries.push(
        `  way["${m.osmKey}"="${m.osmValue}"]["name"](${bbox});`
      );
    }
  }
  return `[out:json][timeout:${OVERPASS_TIMEOUT_SECONDS}];
(
${queries.join("\n")}
);
out center body qt ${MAX_OSM_RESULTS};`;
}
function determineCategory(tags) {
  for (const mapping of OSM_TAG_MAPPINGS) {
    if (tags[mapping.osmKey] === mapping.osmValue) {
      return mapping.category;
    }
  }
  return null;
}
function determineCategoryLabel(tags) {
  for (const mapping of OSM_TAG_MAPPINGS) {
    if (tags[mapping.osmKey] === mapping.osmValue) {
      return mapping.label;
    }
  }
  return "Venue";
}
function buildAddress(tags) {
  const parts = [];
  if (tags["addr:street"]) {
    const street = tags["addr:housenumber"] ? `${tags["addr:street"]} ${tags["addr:housenumber"]}` : tags["addr:street"];
    parts.push(street);
  }
  if (tags["addr:postcode"]) parts.push(tags["addr:postcode"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);
  return parts.length > 0 ? parts.join(", ") : "Address not available";
}
function determinePriceLevel(tags) {
  if (tags.fee === "no" || tags.fee === "0") return 0;
  if (tags.fee === "yes") return 1;
  return 0;
}
function buildDescription(name, categoryLabel) {
  return `${name} \u2014 a ${categoryLabel.toLowerCase()} discovered via OpenStreetMap.`;
}
function extractTags(tags, categoryLabel) {
  const result = [categoryLabel];
  if (tags.wheelchair === "yes") result.push("Wheelchair Accessible");
  if (tags.fee === "no") result.push("Free");
  if (tags.indoor === "yes") result.push("Indoor");
  const isOutdoor = tags.outdoor === "yes" || tags.leisure === "park" || tags.leisure === "playground" || tags.leisure === "garden" || tags.leisure === "nature_reserve";
  if (isOutdoor) result.push("Outdoor");
  return result;
}
function mapOsmElementToActivity(element) {
  const { tags } = element;
  if (!tags.name) return null;
  const category = determineCategory(tags);
  if (!category) return null;
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (lat === void 0 || lon === void 0) return null;
  const categoryLabel = determineCategoryLabel(tags);
  return {
    id: `osm-${element.type}-${element.id}`,
    name: tags.name,
    category,
    rating: 0,
    reviewCount: 0,
    description: tags.description ?? buildDescription(tags.name, categoryLabel),
    priceLevel: determinePriceLevel(tags),
    ageRange: "All ages",
    hours: tags.opening_hours ?? "Check venue for hours",
    address: buildAddress(tags),
    city: tags["addr:city"] ?? "",
    latitude: lat,
    longitude: lon,
    tags: extractTags(tags, categoryLabel),
    website: tags.website ?? tags["contact:website"],
    imageUrl: ""
  };
}
var CACHE_TTL_MS = 10 * 60 * 1e3;
var queryCache = /* @__PURE__ */ new Map();
function buildCacheKey(lat, lng, radiusMeters, category) {
  const roundedLat = Math.round(lat * 1e3) / 1e3;
  const roundedLng = Math.round(lng * 1e3) / 1e3;
  return `${roundedLat},${roundedLng},${radiusMeters},${category ?? "all"}`;
}
function evictExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of queryCache) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      queryCache.delete(key);
    }
  }
}
async function fetchOverpassActivities(lat, lng, radiusMeters, categoryFilter) {
  const cacheKey = buildCacheKey(lat, lng, radiusMeters, categoryFilter);
  const cached = queryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.activities;
  }
  const query = buildOverpassQuery(lat, lng, radiusMeters, categoryFilter);
  if (!query) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`Overpass API returned status ${response.status}`);
      return [];
    }
    const data = await response.json();
    const activities2 = data.elements.map(mapOsmElementToActivity).filter((a) => a !== null);
    const seen = /* @__PURE__ */ new Set();
    const unique = activities2.filter((a) => {
      const key = a.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    queryCache.set(cacheKey, { activities: unique, timestamp: Date.now() });
    evictExpiredEntries();
    return unique;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Overpass API request timed out");
    } else {
      console.error("Overpass API error:", error);
    }
    return [];
  }
}

// server/routes.ts
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
function paginatedResponse(data, total, page, limit) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit
  }
});
async function registerRoutes(httpServer2, app2) {
  app2.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });
      const displayName = validatedData.display_name || validatedData.username;
      const family = await storage.createFamily(
        `${displayName}'s Family`,
        user.id
      );
      await storage.joinFamily(user.id, family.id);
      const updatedUser = await storage.getUser(user.id);
      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.status(201).json({ ...sanitizeUser(updatedUser || user), token });
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValid = await verifyPassword(validatedData.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.json({ ...sanitizeUser(user), token });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  });
  app2.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/family", requireAuth, async (req, res) => {
    try {
      const familyId = req.familyId;
      if (!familyId) {
        return res.status(404).json({ error: "No family found" });
      }
      const family = await storage.getFamily(familyId);
      if (!family) {
        return res.status(404).json({ error: "Family not found" });
      }
      res.json(family);
    } catch (error) {
      console.error("Error fetching family:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/family/members", requireAuth, async (req, res) => {
    try {
      const familyId = req.familyId;
      if (!familyId) {
        return res.status(404).json({ error: "No family found" });
      }
      const members = await storage.getFamilyMembers(familyId);
      res.json(members.map(sanitizeUser));
    } catch (error) {
      console.error("Error fetching family members:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/family/join", requireAuth, async (req, res) => {
    try {
      const { invite_code } = req.body;
      if (!invite_code || typeof invite_code !== "string") {
        return res.status(400).json({ error: "Invite code is required" });
      }
      const family = await storage.getFamilyByInviteCode(invite_code.toUpperCase());
      if (!family) {
        return res.status(404).json({ error: "Invalid invite code" });
      }
      const updatedUser = await storage.joinFamily(req.userId, family.id);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to join family" });
      }
      res.json({ family, user: sanitizeUser(updatedUser) });
    } catch (error) {
      res.status(400).json({ error: "Failed to join family" });
    }
  });
  app2.get("/api/expenses", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { childId, status } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getExpenses(
      familyId,
      childId ? parseInt(childId) : void 0,
      status,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.get("/api/expenses/:id", requireAuth, async (req, res) => {
    const expense = await storage.getExpense(parseInt(req.params.id));
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (expense.family_id !== req.familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(expense);
  });
  app2.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getExpense(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Expense not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const expense = await storage.updateExpense(parseInt(req.params.id), req.body);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getExpense(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Expense not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const success = await storage.deleteExpense(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/messages", requireAuth, async (req, res) => {
    const { otherUserId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getMessages(
      req.userId,
      otherUserId,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    try {
      const count2 = await storage.getUnreadCount(req.userId);
      res.json({ count: count2 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const message = await storage.getMessage(parseInt(req.params.id));
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      const userId = req.userId;
      if (message.sender_id !== userId && message.receiver_id !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(message);
    } catch (error) {
      console.error("Error fetching message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        sender_id: req.userId
      });
      const content_hash = createHash("sha256").update(validatedData.content + req.userId + Date.now()).digest("hex");
      const sender_ip = req.ip || req.socket.remoteAddress;
      const message = await storage.createMessage({
        ...validatedData,
        content_hash,
        sender_ip: sender_ip || void 0
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    if (message.receiver_id !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const updated = await storage.markMessageAsRead(parseInt(req.params.id));
    res.json(updated);
  });
  app2.get("/api/documents", requireAuth, async (req, res) => {
    const { category, childId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getDocuments(
      req.userId,
      category,
      childId ? parseInt(childId) : void 0,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.get("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      const userId = req.userId;
      const sharedWith = Array.isArray(document.shared_with) ? document.shared_with : [];
      if (document.uploaded_by !== userId && !sharedWith.includes(userId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/documents/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const { title, description, category, childId, tags, sharedWith } = req.body;
      const blob = await put(
        `documents/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        { access: "public", contentType: req.file.mimetype }
      );
      const document = await storage.createDocument({
        uploaded_by: req.userId,
        child_id: childId ? parseInt(childId) : null,
        title: title || req.file.originalname,
        description: description || null,
        category: category || "other",
        file_path: blob.url,
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        shared_with: sharedWith ? JSON.parse(sharedWith) : [],
        tags: tags ? JSON.parse(tags) : []
      });
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to upload document" });
    }
  });
  app2.patch("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (document.uploaded_by !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const updated = await storage.updateDocument(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (document.uploaded_by !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      try {
        await del(document.file_path);
      } catch {
      }
      const success = await storage.deleteDocument(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.post("/api/documents/:id/share", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      if (document.uploaded_by !== req.userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const { userIds } = req.body;
      if (!Array.isArray(userIds)) {
        return res.status(400).json({ error: "userIds must be an array" });
      }
      const updated = await storage.shareDocument(parseInt(req.params.id), userIds);
      res.json(updated);
    } catch (error) {
      console.error("Error sharing document:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/children", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getChildren(familyId, { limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.get("/api/children/:id", requireAuth, async (req, res) => {
    const child = await storage.getChild(parseInt(req.params.id));
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    if (child.family_id !== req.familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(child);
  });
  app2.post("/api/children", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getChild(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Child not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const child = await storage.updateChild(parseInt(req.params.id), req.body);
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/events", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { childId, startDate, endDate } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getEvents(
      familyId,
      childId ? parseInt(childId) : void 0,
      startDate,
      endDate,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.get("/api/events/:id", requireAuth, async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.family_id !== req.familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(event);
  });
  app2.post("/api/events", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
    }
  });
  app2.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEvent(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const event = await storage.updateEvent(parseInt(req.params.id), req.body);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEvent(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const success = await storage.deleteEvent(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.get("/api/activities", requireAuth, async (req, res) => {
    const { season } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getActivities(season, { limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/activities", requireAuth, async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/oslo-events", async (req, res) => {
    try {
      const today = /* @__PURE__ */ new Date();
      const getNextWeekendDate = (daysAhead) => {
        const date = new Date(today);
        date.setDate(date.getDate() + daysAhead);
        return date.toISOString();
      };
      const mockEvents = {
        items: [
          {
            id: "oslo-1",
            title: "Munch Museum - MUNCH Triennale",
            name: "Almost Unreal Exhibition",
            description: "Experience the MUNCH Triennale featuring 26 artists exploring spaces between real and virtual. Open daily with free entry Wed 18-21.",
            startDate: getNextWeekendDate(2),
            // This Saturday
            startTime: "10:00",
            location: { name: "Bj\xF8rvika, Oslo" },
            categories: [{ name: "Museum" }, { name: "Kultur" }, { name: "Art" }],
            image: { url: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=400" },
            isFree: false,
            price: "Free Wed 18-21, Regular admission other times",
            url: "https://munch.no"
          },
          {
            id: "oslo-2",
            title: "Natural History Museum",
            name: "Dinosaurs & Wildlife Discovery",
            description: "Explore dinosaur skeletons, minerals, and Norwegian wildlife. Open Tue-Sun 10:00-17:00. Perfect for curious kids!",
            startDate: getNextWeekendDate(3),
            // Sunday
            startTime: "10:00",
            location: { name: "T\xF8yen, Oslo" },
            categories: [{ name: "Museum" }, { name: "Educational" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1548345680-f5475ea5df84?w=400" },
            isFree: false,
            price: "Check website for current rates",
            url: "https://www.nhm.uio.no"
          },
          {
            id: "oslo-3",
            title: "Vigeland Sculpture Park",
            name: "Winter Walk Among Sculptures",
            description: "Discover 200+ sculptures by Gustav Vigeland. Free entry, open 24/7. Beautiful winter scenery with playgrounds for kids.",
            startDate: getNextWeekendDate(1),
            // Tomorrow
            startTime: "00:00",
            location: { name: "Frogner, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Park" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400" },
            isFree: true,
            url: "https://vigeland.museum.no"
          },
          {
            id: "oslo-4",
            title: "Deichman Bj\xF8rvika - Children's Activities",
            name: "Barnas L\xF8rdag (Children's Saturday)",
            description: "Free children's activities at Oslo's main library. Stories, crafts, and fun for ages 3-12. No registration needed!",
            startDate: getNextWeekendDate(2),
            // Saturday
            startTime: "12:00",
            location: { name: "Bj\xF8rvika, Oslo" },
            categories: [{ name: "Educational" }, { name: "Barn" }, { name: "Indoor" }],
            image: { url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400" },
            isFree: true,
            url: "https://www.deichman.no"
          },
          {
            id: "oslo-5",
            title: "Norwegian Museum of Science and Technology",
            name: "Weekend Science Shows",
            description: "Interactive science exhibits and live demonstrations. Energy, transport, communication exhibits. Weekend family activities!",
            startDate: getNextWeekendDate(2),
            // Saturday
            startTime: "10:00",
            location: { name: "Kjels\xE5s, Oslo" },
            categories: [{ name: "Museum" }, { name: "Educational" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400" },
            isFree: false,
            price: "Check website for tickets",
            url: "https://www.tekniskmuseum.no"
          },
          {
            id: "oslo-6",
            title: "Sentralen - Free Arts & Crafts",
            name: "Weekend Family Workshop",
            description: "Every weekend, free arts and crafts activities for children in central Oslo. Drop in, no registration required!",
            startDate: getNextWeekendDate(3),
            // Sunday
            startTime: "12:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Art" }, { name: "Barn" }, { name: "Indoor" }],
            image: { url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400" },
            isFree: true,
            url: "https://www.visitoslo.com"
          },
          {
            id: "oslo-7",
            title: "Holmenkollen - Winter Activities",
            name: "Ski Jump View & Toboggan Run",
            description: "Visit the iconic ski jump with Oslo views. Nearby toboggan runs perfect for families. Winter wonderland experience!",
            startDate: getNextWeekendDate(2),
            // Saturday
            startTime: "10:00",
            location: { name: "Holmenkollen, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Sport" }, { name: "Winter" }],
            image: { url: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400" },
            isFree: false,
            price: "Ski jump museum: ~150 NOK, Toboggan: Free",
            url: "https://www.holmenkollen.com"
          },
          {
            id: "oslo-8",
            title: "Ekebergparken Sculpture Park",
            name: "Art & Nature Winter Walk",
            description: "Contemporary sculpture park with 42 artworks. Beautiful winter hiking trails with panoramic Oslo views. Always open, always free!",
            startDate: getNextWeekendDate(1),
            // Tomorrow
            startTime: "00:00",
            location: { name: "Ekeberg, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Kultur" }, { name: "Art" }],
            image: { url: "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=400" },
            isFree: true,
            url: "https://ekebergparken.com"
          },
          {
            id: "oslo-9",
            title: "National Museum - Family Workshop",
            name: "Creative Art Activities for Kids",
            description: "Weekend family workshops where children can experiment with different art techniques. Ages 4-12 welcome!",
            startDate: getNextWeekendDate(3),
            // Sunday
            startTime: "13:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Museum" }, { name: "Art" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400" },
            isFree: false,
            price: "Some workshops free, check website",
            url: "https://www.nasjonalmuseet.no"
          },
          {
            id: "oslo-10",
            title: "Oslo Winter Markets & Ice Skating",
            name: "City Center Winter Activities",
            description: "Enjoy winter markets, ice skating rinks, and festive atmosphere in central Oslo. Perfect for families during winter season.",
            startDate: getNextWeekendDate(2),
            // Saturday
            startTime: "11:00",
            location: { name: "Sentrum, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Winter" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1546016140-f2dc006a8490?w=400" },
            isFree: true,
            price: "Free to visit, skating rink fees apply",
            url: "https://www.visitoslo.com"
          }
        ]
      };
      res.json(mockEvents);
    } catch (error) {
      console.error("Error fetching Oslo events:", error);
      res.status(500).json({ error: "Failed to fetch Oslo events" });
    }
  });
  app2.get("/api/friends", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getFriends(familyId, { limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/friends", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/friends/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getFriend(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Friend not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const friend = await storage.updateFriend(parseInt(req.params.id), req.body);
      res.json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/social-events", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getSocialEvents(familyId, { limit, offset });
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/social-events", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSocialEventSchema.parse(req.body);
      const event = await storage.createSocialEvent({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/social-events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSocialEvent(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Social event not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const event = await storage.updateSocialEvent(parseInt(req.params.id), req.body);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/reading-list", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { childId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getReadingList(
      familyId,
      childId ? parseInt(childId) : void 0,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/reading-list", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReadingListSchema.parse(req.body);
      const item = await storage.createReadingListItem({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/reading-list/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getReadingListItem(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Reading list item not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const item = await storage.updateReadingListItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/school-tasks", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { childId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getSchoolTasks(
      familyId,
      childId ? parseInt(childId) : void 0,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/school-tasks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSchoolTaskSchema.parse(req.body);
      const task = await storage.createSchoolTask({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/school-tasks/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSchoolTask(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "School task not found" });
      }
      if (existing.family_id !== req.familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const task = await storage.updateSchoolTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/handover-notes", requireAuth, async (req, res) => {
    const familyId = req.familyId;
    const { childId } = req.query;
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await storage.getHandoverNotes(
      familyId,
      childId ? parseInt(childId) : void 0,
      { limit, offset }
    );
    res.json(paginatedResponse(data, total, page, limit));
  });
  app2.post("/api/handover-notes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHandoverNoteSchema.parse(req.body);
      const note = await storage.createHandoverNote({
        ...validatedData,
        family_id: req.familyId
      });
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/places/nearby", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat);
      const lng = parseFloat(req.query.lng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({ error: "lat and lng query parameters are required and must be valid numbers" });
      }
      const radiusMeters = Math.min(
        Math.max(1e3, parseInt(req.query.radius) || 3e4),
        1e5
      );
      const radiusKm = radiusMeters / 1e3;
      const categoryFilter = req.query.category;
      const curatedResults = ALL_ACTIVITIES.filter((a) => !categoryFilter || a.category === categoryFilter).map((a) => ({
        ...a,
        distanceKm: Math.round(haversineDistanceKm(lat, lng, a.latitude, a.longitude) * 10) / 10,
        source: "curated"
      })).filter((a) => a.distanceKm <= radiusKm).sort((a, b) => a.distanceKm - b.distanceKm);
      let osmResults = [];
      try {
        const overpassActivities = await fetchOverpassActivities(
          lat,
          lng,
          radiusMeters,
          categoryFilter
        );
        osmResults = overpassActivities.map((a) => ({
          ...a,
          distanceKm: Math.round(haversineDistanceKm(lat, lng, a.latitude, a.longitude) * 10) / 10,
          source: "openstreetmap"
        })).filter((a) => a.distanceKm <= radiusKm);
      } catch (error) {
        console.warn("Overpass API failed, serving curated results only:", error);
      }
      const DEDUP_THRESHOLD_KM = 0.2;
      const dedupedOsm = osmResults.filter((osm) => {
        return !curatedResults.some(
          (curated) => haversineDistanceKm(
            osm.latitude,
            osm.longitude,
            curated.latitude,
            curated.longitude
          ) < DEDUP_THRESHOLD_KM
        );
      });
      const merged = [...curatedResults, ...dedupedOsm].sort((a, b) => a.distanceKm - b.distanceKm);
      res.json({
        activities: merged,
        total: merged.length,
        center: { latitude: lat, longitude: lng },
        radiusKm
      });
    } catch (error) {
      console.error("Error fetching nearby places:", error);
      res.status(500).json({ error: "Failed to fetch nearby places" });
    }
  });
  return httpServer2;
}
var EARTH_RADIUS_KM = 6371;
function degreesToRadians(degrees) {
  return degrees * (Math.PI / 180);
}
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLng = degreesToRadians(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// server/vercel-entry.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
applySecurityMiddleware(app);
var httpServer = createServer(app);
await registerRoutes(httpServer, app);
app.use(errorHandler);
var vercel_entry_default = app;
export {
  vercel_entry_default as default
};
