import {
  type Family,
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Event,
  type InsertEvent,
  type Activity,
  type InsertActivity,
  type Friend,
  type InsertFriend,
  type SocialEvent,
  type InsertSocialEvent,
  type ReadingListItem,
  type InsertReadingListItem,
  type SchoolTask,
  type InsertSchoolTask,
  type HandoverNote,
  type InsertHandoverNote,
  type Expense,
  type InsertExpense,
  type Message,
  type InsertMessage,
  type Document,
  type InsertDocument,
} from "../shared/schema";
import {
  families,
  users,
  children,
  events,
  activities,
  friends,
  socialEvents,
  readingList,
  schoolTasks,
  handoverNotes,
  expenses,
  messages,
  documents,
} from "./tables";
import { db } from "./db";
import { eq, and, or, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // Family methods
  createFamily(name: string, createdBy: string): Promise<Family>;
  getFamily(id: string): Promise<Family | undefined>;
  getFamilyByInviteCode(code: string): Promise<Family | undefined>;
  joinFamily(userId: string, familyId: string): Promise<User | undefined>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Children methods
  getChildren(familyId?: string): Promise<Child[]>;
  getChild(id: number): Promise<Child | undefined>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined>;

  // Events methods
  getEvents(familyId?: string, childId?: number, startDate?: string, endDate?: string): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Activities methods
  getActivities(season?: string): Promise<Activity[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;

  // Friends methods
  getFriends(familyId?: string): Promise<Friend[]>;
  getFriend(id: number): Promise<Friend | undefined>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  updateFriend(id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined>;

  // Social Events methods
  getSocialEvents(familyId?: string): Promise<SocialEvent[]>;
  getSocialEvent(id: number): Promise<SocialEvent | undefined>;
  createSocialEvent(event: InsertSocialEvent): Promise<SocialEvent>;
  updateSocialEvent(id: number, event: Partial<InsertSocialEvent>): Promise<SocialEvent | undefined>;

  // Reading List methods
  getReadingList(familyId?: string, childId?: number): Promise<ReadingListItem[]>;
  getReadingListItem(id: number): Promise<ReadingListItem | undefined>;
  createReadingListItem(item: InsertReadingListItem): Promise<ReadingListItem>;
  updateReadingListItem(id: number, item: Partial<InsertReadingListItem>): Promise<ReadingListItem | undefined>;

  // School Tasks methods
  getSchoolTasks(familyId?: string, childId?: number): Promise<SchoolTask[]>;
  getSchoolTask(id: number): Promise<SchoolTask | undefined>;
  createSchoolTask(task: InsertSchoolTask): Promise<SchoolTask>;
  updateSchoolTask(id: number, task: Partial<InsertSchoolTask>): Promise<SchoolTask | undefined>;

  // Handover Notes methods
  getHandoverNotes(familyId?: string, childId?: number): Promise<HandoverNote[]>;
  createHandoverNote(note: InsertHandoverNote): Promise<HandoverNote>;

  // Expense methods
  getExpenses(familyId?: string, childId?: number, status?: string): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Message methods
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage & { content_hash: string; sender_id: string; family_id: string; sender_ip?: string }): Promise<Message>;
  markMessageAsRead(id: string): Promise<Message | undefined>;
  getUnreadCount(userId: string): Promise<number>;

  // Document methods
  getDocuments(userId: string, category?: string, childId?: number): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: string): Promise<boolean>;
  shareDocument(id: string, userIds: string[]): Promise<Document | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Family methods
  async createFamily(name: string, createdBy: string): Promise<Family> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [family] = await db.insert(families).values({
      name,
      created_by: createdBy,
      invite_code: inviteCode,
    }).returning();
    return family;
  }

  async getFamily(id: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.id, id));
    return family || undefined;
  }

  async getFamilyByInviteCode(code: string): Promise<Family | undefined> {
    const [family] = await db.select().from(families).where(eq(families.invite_code, code));
    return family || undefined;
  }

  async joinFamily(userId: string, familyId: string): Promise<User | undefined> {
    const [updated] = await db.update(users)
      .set({ family_id: familyId })
      .where(eq(users.id, userId))
      .returning();
    return updated || undefined;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Children methods
  async getChildren(familyId?: string): Promise<Child[]> {
    if (familyId) {
      return db.select().from(children).where(eq(children.family_id, familyId));
    }
    return db.select().from(children);
  }

  async getChild(id: number): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child || undefined;
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db.insert(children).values(child).returning();
    return newChild;
  }

  async updateChild(id: number, child: Partial<InsertChild>): Promise<Child | undefined> {
    const [updated] = await db.update(children).set(child).where(eq(children.id, id)).returning();
    return updated || undefined;
  }

  // Events methods
  async getEvents(familyId?: string, childId?: number, startDate?: string, endDate?: string): Promise<Event[]> {
    const query = db.select().from(events);

    const conditions = [];
    if (familyId) conditions.push(eq(events.family_id, familyId));
    if (childId) conditions.push(eq(events.child_id, childId));
    if (startDate) conditions.push(gte(events.start_date, startDate));
    if (endDate) conditions.push(lte(events.start_date, endDate));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events).set(event).where(eq(events.id, id)).returning();
    return updated || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id)).returning();
    return result.length > 0;
  }

  // Activities methods
  async getActivities(season?: string): Promise<Activity[]> {
    if (season) {
      return db.select().from(activities).where(eq(activities.season, season));
    }
    return db.select().from(activities);
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  // Friends methods
  async getFriends(familyId?: string): Promise<Friend[]> {
    if (familyId) {
      return db.select().from(friends).where(eq(friends.family_id, familyId));
    }
    return db.select().from(friends);
  }

  async getFriend(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend || undefined;
  }

  async createFriend(friend: InsertFriend): Promise<Friend> {
    const [newFriend] = await db.insert(friends).values(friend).returning();
    return newFriend;
  }

  async updateFriend(id: number, friend: Partial<InsertFriend>): Promise<Friend | undefined> {
    const [updated] = await db.update(friends).set(friend).where(eq(friends.id, id)).returning();
    return updated || undefined;
  }

  // Social Events methods
  async getSocialEvents(familyId?: string): Promise<SocialEvent[]> {
    if (familyId) {
      return db.select().from(socialEvents).where(eq(socialEvents.family_id, familyId));
    }
    return db.select().from(socialEvents);
  }

  async getSocialEvent(id: number): Promise<SocialEvent | undefined> {
    const [event] = await db.select().from(socialEvents).where(eq(socialEvents.id, id));
    return event || undefined;
  }

  async createSocialEvent(event: InsertSocialEvent): Promise<SocialEvent> {
    const [newEvent] = await db.insert(socialEvents).values(event).returning();
    return newEvent;
  }

  async updateSocialEvent(id: number, event: Partial<InsertSocialEvent>): Promise<SocialEvent | undefined> {
    const [updated] = await db.update(socialEvents).set(event).where(eq(socialEvents.id, id)).returning();
    return updated || undefined;
  }

  // Reading List methods
  async getReadingList(familyId?: string, childId?: number): Promise<ReadingListItem[]> {
    const conditions = [];
    if (familyId) conditions.push(eq(readingList.family_id, familyId));
    if (childId) conditions.push(eq(readingList.child_id, childId));

    if (conditions.length > 0) {
      return db.select().from(readingList).where(and(...conditions));
    }
    return db.select().from(readingList);
  }

  async getReadingListItem(id: number): Promise<ReadingListItem | undefined> {
    const [item] = await db.select().from(readingList).where(eq(readingList.id, id));
    return item || undefined;
  }

  async createReadingListItem(item: InsertReadingListItem): Promise<ReadingListItem> {
    const [newItem] = await db.insert(readingList).values(item).returning();
    return newItem;
  }

  async updateReadingListItem(id: number, item: Partial<InsertReadingListItem>): Promise<ReadingListItem | undefined> {
    const [updated] = await db.update(readingList).set(item).where(eq(readingList.id, id)).returning();
    return updated || undefined;
  }

  // School Tasks methods
  async getSchoolTasks(familyId?: string, childId?: number): Promise<SchoolTask[]> {
    const conditions = [];
    if (familyId) conditions.push(eq(schoolTasks.family_id, familyId));
    if (childId) conditions.push(eq(schoolTasks.child_id, childId));

    if (conditions.length > 0) {
      return db.select().from(schoolTasks).where(and(...conditions));
    }
    return db.select().from(schoolTasks);
  }

  async getSchoolTask(id: number): Promise<SchoolTask | undefined> {
    const [task] = await db.select().from(schoolTasks).where(eq(schoolTasks.id, id));
    return task || undefined;
  }

  async createSchoolTask(task: InsertSchoolTask): Promise<SchoolTask> {
    const [newTask] = await db.insert(schoolTasks).values(task).returning();
    return newTask;
  }

  async updateSchoolTask(id: number, task: Partial<InsertSchoolTask>): Promise<SchoolTask | undefined> {
    const [updated] = await db.update(schoolTasks).set(task).where(eq(schoolTasks.id, id)).returning();
    return updated || undefined;
  }

  // Handover Notes methods
  async getHandoverNotes(familyId?: string, childId?: number): Promise<HandoverNote[]> {
    const query = db.select().from(handoverNotes).orderBy(desc(handoverNotes.created_at));

    const conditions = [];
    if (familyId) conditions.push(eq(handoverNotes.family_id, familyId));
    if (childId) conditions.push(eq(handoverNotes.child_id, childId));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async createHandoverNote(note: InsertHandoverNote): Promise<HandoverNote> {
    const [newNote] = await db.insert(handoverNotes).values(note).returning();
    return newNote;
  }

  // Expense methods
  async getExpenses(familyId?: string, childId?: number, status?: string): Promise<Expense[]> {
    const query = db.select().from(expenses).orderBy(desc(expenses.date));

    const conditions = [];
    if (familyId) conditions.push(eq(expenses.family_id, familyId));
    if (childId) conditions.push(eq(expenses.child_id, childId));
    if (status) conditions.push(eq(expenses.status, status));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const [expense] = await db.select().from(expenses).where(eq(expenses.id, id));
    return expense || undefined;
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses).set(expense).where(eq(expenses.id, id)).returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses).where(eq(expenses.id, id)).returning();
    return result.length > 0;
  }

  // Message methods
  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    const query = db.select().from(messages).orderBy(desc(messages.created_at));

    if (otherUserId) {
      // Get conversation between two users
      return query.where(
        or(
          and(eq(messages.sender_id, userId), eq(messages.receiver_id, otherUserId)),
          and(eq(messages.sender_id, otherUserId), eq(messages.receiver_id, userId))
        )
      );
    } else {
      // Get all messages for user (sent or received)
      return query.where(
        or(eq(messages.receiver_id, userId), eq(messages.sender_id, userId))
      );
    }
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async createMessage(message: InsertMessage & { content_hash: string; sender_id: string; family_id: string; sender_ip?: string }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessageAsRead(id: string): Promise<Message | undefined> {
    const [updated] = await db.update(messages)
      .set({ is_read: true, read_at: new Date().toISOString() })
      .where(eq(messages.id, id))
      .returning();
    return updated || undefined;
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(messages)
      .where(and(eq(messages.receiver_id, userId), eq(messages.is_read, false)));
    return result.length;
  }

  // Document methods
  async getDocuments(userId: string, category?: string, childId?: number): Promise<Document[]> {
    const query = db.select().from(documents).orderBy(desc(documents.created_at));

    const conditions = [];

    // User can see documents they uploaded or that are shared with them
    conditions.push(
      or(
        eq(documents.uploaded_by, userId),
        // This is a simplified check - in production you'd use SQL array contains
        eq(documents.uploaded_by, userId) // Placeholder - needs proper array contains check
      )
    );

    if (category) conditions.push(eq(documents.category, category));
    if (childId) conditions.push(eq(documents.child_id, childId));

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }
    return query;
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ ...document, updated_at: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  async shareDocument(id: string, userIds: string[]): Promise<Document | undefined> {
    const [updated] = await db.update(documents)
      .set({ shared_with: userIds, updated_at: new Date().toISOString() })
      .where(eq(documents.id, id))
      .returning();
    return updated || undefined;
  }
}

export const storage = new DatabaseStorage();
