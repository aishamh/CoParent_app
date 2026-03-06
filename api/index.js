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
import { eq, and, or, gte, lte, desc } from "drizzle-orm";
var DatabaseStorage = class {
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
  // Children methods
  async getChildren() {
    return db.select().from(children);
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
  async getEvents(childId, startDate, endDate) {
    const query = db.select().from(events);
    const conditions = [];
    if (childId) conditions.push(eq(events.child_id, childId));
    if (startDate) conditions.push(gte(events.start_date, startDate));
    if (endDate) conditions.push(lte(events.start_date, endDate));
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
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
  async getActivities(season) {
    if (season) {
      return db.select().from(activities).where(eq(activities.season, season));
    }
    return db.select().from(activities);
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
  async getFriends() {
    return db.select().from(friends);
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
  async getSocialEvents() {
    return db.select().from(socialEvents);
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
  async getReadingList(childId) {
    if (childId) {
      return db.select().from(readingList).where(eq(readingList.child_id, childId));
    }
    return db.select().from(readingList);
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
  async getSchoolTasks(childId) {
    if (childId) {
      return db.select().from(schoolTasks).where(eq(schoolTasks.child_id, childId));
    }
    return db.select().from(schoolTasks);
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
  async getHandoverNotes(childId) {
    const query = db.select().from(handoverNotes).orderBy(desc(handoverNotes.created_at));
    if (childId) {
      return query.where(eq(handoverNotes.child_id, childId));
    }
    return query;
  }
  async createHandoverNote(note) {
    const [newNote] = await db.insert(handoverNotes).values(note).returning();
    return newNote;
  }
  // Expense methods
  async getExpenses(childId, status) {
    const query = db.select().from(expenses).orderBy(desc(expenses.date));
    const conditions = [];
    if (childId) conditions.push(eq(expenses.child_id, childId));
    if (status) conditions.push(eq(expenses.status, status));
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
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
  async getMessages(userId, otherUserId) {
    const query = db.select().from(messages).orderBy(desc(messages.created_at));
    if (otherUserId) {
      return query.where(
        or(
          and(eq(messages.sender_id, userId), eq(messages.receiver_id, otherUserId)),
          and(eq(messages.sender_id, otherUserId), eq(messages.receiver_id, userId))
        )
      );
    } else {
      return query.where(
        or(eq(messages.receiver_id, userId), eq(messages.sender_id, userId))
      );
    }
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
  async getDocuments(userId, category, childId) {
    const query = db.select().from(documents).orderBy(desc(documents.created_at));
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
    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
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
var JWT_SECRET = process.env.JWT_SECRET || "coparent-jwt-secret-change-in-production";
var JWT_EXPIRES_IN = "7d";
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
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
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
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = payload.userId;
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
var validateOrigin = (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    return next();
  }
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || (process.env.NODE_ENV === "production" ? "https://your-domain.netlify.app" : "http://localhost:5173")).split(",");
  const isAllowed = allowedOrigins.some((allowed) => {
    return origin === allowed.trim() || allowed.trim() === "*";
  });
  if (!isAllowed) {
    return res.status(403).json({
      error: "Origin not allowed"
    });
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

// server/routes.ts
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
      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1e3
        // 7 days
      });
      res.status(201).json({ ...sanitizeUser(user), token });
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      console.log("Login attempt for username:", req.body.username);
      const validatedData = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        console.log("User not found:", validatedData.username);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const isValid = await verifyPassword(validatedData.password, user.password);
      if (!isValid) {
        console.log("Invalid password for user:", validatedData.username);
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
      console.log("Login successful for user:", user.username);
      res.json({ ...sanitizeUser(user), token });
    } catch (error) {
      console.error("Login error:", error);
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
    const user = await storage.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(sanitizeUser(user));
  });
  app2.get("/api/expenses", async (req, res) => {
    const { childId, status } = req.query;
    const expenses2 = await storage.getExpenses(
      childId ? parseInt(childId) : void 0,
      status
    );
    res.json(expenses2);
  });
  app2.get("/api/expenses/:id", async (req, res) => {
    const expense = await storage.getExpense(parseInt(req.params.id));
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.json(expense);
  });
  app2.post("/api/expenses", async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(validatedData);
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateExpense(parseInt(req.params.id), req.body);
      if (!expense) {
        return res.status(404).json({ error: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/expenses/:id", async (req, res) => {
    const success = await storage.deleteExpense(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/messages", requireAuth, async (req, res) => {
    const { otherUserId } = req.query;
    const messages2 = await storage.getMessages(
      req.userId,
      otherUserId
    );
    res.json(messages2);
  });
  app2.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    const count = await storage.getUnreadCount(req.userId);
    res.json({ count });
  });
  app2.get("/api/messages/:id", async (req, res) => {
    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
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
    const documents2 = await storage.getDocuments(
      req.userId,
      category,
      childId ? parseInt(childId) : void 0
    );
    res.json(documents2);
  });
  app2.get("/api/documents/:id", async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
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
  });
  app2.post("/api/documents/:id/share", requireAuth, async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    if (document.uploaded_by !== req.userId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const { userIds } = req.body;
    const updated = await storage.shareDocument(parseInt(req.params.id), userIds);
    res.json(updated);
  });
  app2.get("/api/children", async (req, res) => {
    const children2 = await storage.getChildren();
    res.json(children2);
  });
  app2.get("/api/children/:id", async (req, res) => {
    const child = await storage.getChild(parseInt(req.params.id));
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    res.json(child);
  });
  app2.post("/api/children", async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild(validatedData);
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/children/:id", async (req, res) => {
    try {
      const child = await storage.updateChild(parseInt(req.params.id), req.body);
      if (!child) {
        return res.status(404).json({ error: "Child not found" });
      }
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/events", async (req, res) => {
    const { childId, startDate, endDate } = req.query;
    const events2 = await storage.getEvents(
      childId ? parseInt(childId) : void 0,
      startDate,
      endDate
    );
    res.json(events2);
  });
  app2.get("/api/events/:id", async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  });
  app2.post("/api/events", async (req, res) => {
    try {
      console.log("Received event data:", JSON.stringify(req.body, null, 2));
      const validatedData = insertEventSchema.parse(req.body);
      console.log("Validated event data:", validatedData);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      console.error("Event creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(400).json({ error: "Invalid data" });
      }
    }
  });
  app2.patch("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.updateEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.delete("/api/events/:id", async (req, res) => {
    const success = await storage.deleteEvent(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  });
  app2.get("/api/activities", async (req, res) => {
    const { season } = req.query;
    const activities2 = await storage.getActivities(season);
    res.json(activities2);
  });
  app2.post("/api/activities", async (req, res) => {
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
  app2.get("/api/friends", async (req, res) => {
    const friends2 = await storage.getFriends();
    res.json(friends2);
  });
  app2.post("/api/friends", async (req, res) => {
    try {
      const validatedData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend(validatedData);
      res.status(201).json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/friends/:id", async (req, res) => {
    try {
      const friend = await storage.updateFriend(parseInt(req.params.id), req.body);
      if (!friend) {
        return res.status(404).json({ error: "Friend not found" });
      }
      res.json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/social-events", async (req, res) => {
    const events2 = await storage.getSocialEvents();
    res.json(events2);
  });
  app2.post("/api/social-events", async (req, res) => {
    try {
      const validatedData = insertSocialEventSchema.parse(req.body);
      const event = await storage.createSocialEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/social-events/:id", async (req, res) => {
    try {
      const event = await storage.updateSocialEvent(parseInt(req.params.id), req.body);
      if (!event) {
        return res.status(404).json({ error: "Social event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/reading-list", async (req, res) => {
    const { childId } = req.query;
    const items = await storage.getReadingList(
      childId ? parseInt(childId) : void 0
    );
    res.json(items);
  });
  app2.post("/api/reading-list", async (req, res) => {
    try {
      const validatedData = insertReadingListSchema.parse(req.body);
      const item = await storage.createReadingListItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/reading-list/:id", async (req, res) => {
    try {
      const item = await storage.updateReadingListItem(parseInt(req.params.id), req.body);
      if (!item) {
        return res.status(404).json({ error: "Reading list item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/school-tasks", async (req, res) => {
    const { childId } = req.query;
    const tasks = await storage.getSchoolTasks(
      childId ? parseInt(childId) : void 0
    );
    res.json(tasks);
  });
  app2.post("/api/school-tasks", async (req, res) => {
    try {
      const validatedData = insertSchoolTaskSchema.parse(req.body);
      const task = await storage.createSchoolTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.patch("/api/school-tasks/:id", async (req, res) => {
    try {
      const task = await storage.updateSchoolTask(parseInt(req.params.id), req.body);
      if (!task) {
        return res.status(404).json({ error: "School task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  app2.get("/api/handover-notes", async (req, res) => {
    const { childId } = req.query;
    const notes = await storage.getHandoverNotes(
      childId ? parseInt(childId) : void 0
    );
    res.json(notes);
  });
  app2.post("/api/handover-notes", async (req, res) => {
    try {
      const validatedData = insertHandoverNoteSchema.parse(req.body);
      const note = await storage.createHandoverNote(validatedData);
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });
  return httpServer2;
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
