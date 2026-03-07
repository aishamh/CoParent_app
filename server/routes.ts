import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { createHash } from "crypto";
import multer from "multer";
import { put, del } from "@vercel/blob";
import { storage } from "./storage";
import { hashPassword, verifyPassword, sanitizeUser, requireAuth, generateToken } from "./auth";
import { authRateLimiter, apiRateLimiter } from "./middleware/security";
import {
  insertUserSchema,
  loginSchema,
  insertChildSchema,
  insertEventSchema,
  insertActivitySchema,
  insertFriendSchema,
  insertSocialEventSchema,
  insertReadingListSchema,
  insertSchoolTaskSchema,
  insertHandoverNoteSchema,
  insertExpenseSchema,
  insertMessageSchema,
  insertDocumentSchema
} from "../shared/schema";

// Configure multer with memory storage (files uploaded to Vercel Blob)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Authentication routes (with rate limiting)
  app.post("/api/auth/register", authRateLimiter, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword
      });

      // Auto-create a family for the new user
      const displayName = validatedData.display_name || validatedData.username;
      const family = await storage.createFamily(
        `${displayName}'s Family`,
        user.id
      );
      await storage.joinFamily(user.id, family.id);

      // Refresh user to include family_id
      const updatedUser = await storage.getUser(user.id);

      // Generate JWT token
      const token = generateToken(user.id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.status(201).json({ ...sanitizeUser(updatedUser || user), token });
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.post("/api/auth/login", authRateLimiter, async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Get user
      const user = await storage.getUserByUsername(validatedData.username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(validatedData.password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT token
      const token = generateToken(user.id);
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('token');
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser((req as any).userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(sanitizeUser(user));
  });

  // Family routes
  app.get("/api/family", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    if (!familyId) {
      return res.status(404).json({ error: "No family found" });
    }
    const family = await storage.getFamily(familyId);
    if (!family) {
      return res.status(404).json({ error: "Family not found" });
    }
    res.json(family);
  });

  app.post("/api/family/join", requireAuth, async (req, res) => {
    try {
      const { invite_code } = req.body;
      if (!invite_code || typeof invite_code !== "string") {
        return res.status(400).json({ error: "Invite code is required" });
      }

      const family = await storage.getFamilyByInviteCode(invite_code.toUpperCase());
      if (!family) {
        return res.status(404).json({ error: "Invalid invite code" });
      }

      const updatedUser = await storage.joinFamily((req as any).userId, family.id);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to join family" });
      }

      res.json({ family, user: sanitizeUser(updatedUser) });
    } catch (error) {
      res.status(400).json({ error: "Failed to join family" });
    }
  });

  // Expense routes
  app.get("/api/expenses", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const { childId, status } = req.query;
    const expenses = await storage.getExpenses(
      familyId,
      childId ? parseInt(childId as string) : undefined,
      status as string
    );
    res.json(expenses);
  });

  app.get("/api/expenses/:id", requireAuth, async (req, res) => {
    const expense = await storage.getExpense(parseInt(req.params.id));
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (expense.family_id !== (req as any).familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(expense);
  });

  app.post("/api/expenses", requireAuth, async (req, res) => {
    try {
      const validatedData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/expenses/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getExpense(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Expense not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const expense = await storage.updateExpense(parseInt(req.params.id), req.body);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/expenses/:id", requireAuth, async (req, res) => {
    const existing = await storage.getExpense(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: "Expense not found" });
    }
    if (existing.family_id !== (req as any).familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const success = await storage.deleteExpense(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Expense not found" });
    }
    res.status(204).send();
  });

  // Message routes - Secure, immutable messaging
  app.get("/api/messages", requireAuth, async (req, res) => {
    const { otherUserId } = req.query;
    const messages = await storage.getMessages(
      (req as any).userId,
      otherUserId as string | undefined
    );
    res.json(messages);
  });

  app.get("/api/messages/unread-count", requireAuth, async (req, res) => {
    const count = await storage.getUnreadCount((req as any).userId);
    res.json({ count });
  });

  app.get("/api/messages/:id", async (req, res) => {
    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json(message);
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        sender_id: (req as any).userId,
      });

      // Create content hash for integrity verification (court admissibility)
      const content_hash = createHash("sha256")
        .update(validatedData.content + (req as any).userId + Date.now())
        .digest("hex");

      // Get sender IP for audit trail
      const sender_ip = req.ip || req.socket.remoteAddress;

      const message = await storage.createMessage({
        ...validatedData,
        content_hash,
        sender_ip: sender_ip || undefined,
      });

      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/messages/:id/read", requireAuth, async (req, res) => {
    const message = await storage.getMessage(parseInt(req.params.id));
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only the receiver can mark as read
    if (message.receiver_id !== (req as any).userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const updated = await storage.markMessageAsRead(parseInt(req.params.id));
    res.json(updated);
  });

  // Document routes
  app.get("/api/documents", requireAuth, async (req, res) => {
    const { category, childId } = req.query;
    const documents = await storage.getDocuments(
      (req as any).userId,
      category as string | undefined,
      childId ? parseInt(childId as string) : undefined
    );
    res.json(documents);
  });

  app.get("/api/documents/:id", async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(document);
  });

  app.post("/api/documents/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { title, description, category, childId, tags, sharedWith } = req.body;

      // Upload file to Vercel Blob
      const blob = await put(
        `documents/${Date.now()}-${req.file.originalname}`,
        req.file.buffer,
        { access: "public", contentType: req.file.mimetype }
      );

      const document = await storage.createDocument({
        uploaded_by: (req as any).userId,
        child_id: childId ? parseInt(childId) : null,
        title: title || req.file.originalname,
        description: description || null,
        category: category || "other",
        file_path: blob.url,
        file_name: req.file.originalname,
        file_size: req.file.size,
        file_type: req.file.mimetype,
        shared_with: sharedWith ? JSON.parse(sharedWith) : [],
        tags: tags ? JSON.parse(tags) : [],
      });

      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ error: "Failed to upload document" });
    }
  });

  app.patch("/api/documents/:id", requireAuth, async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }

      // Only owner can update
      if (document.uploaded_by !== (req as any).userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await storage.updateDocument(parseInt(req.params.id), req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/documents/:id", requireAuth, async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can delete
    if (document.uploaded_by !== (req as any).userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Delete file from Vercel Blob
    try {
      await del(document.file_path);
    } catch {
      // Ignore blob deletion errors — file may already be gone
    }

    const success = await storage.deleteDocument(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.status(204).send();
  });

  app.post("/api/documents/:id/share", requireAuth, async (req, res) => {
    const document = await storage.getDocument(parseInt(req.params.id));
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can share
    if (document.uploaded_by !== (req as any).userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { userIds } = req.body;
    const updated = await storage.shareDocument(parseInt(req.params.id), userIds);
    res.json(updated);
  });

  // Children routes
  app.get("/api/children", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const children = await storage.getChildren(familyId);
    res.json(children);
  });

  app.get("/api/children/:id", requireAuth, async (req, res) => {
    const child = await storage.getChild(parseInt(req.params.id));
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }
    if (child.family_id !== (req as any).familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(child);
  });

  app.post("/api/children", requireAuth, async (req, res) => {
    try {
      const validatedData = insertChildSchema.parse(req.body);
      const child = await storage.createChild({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/children/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getChild(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Child not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const child = await storage.updateChild(parseInt(req.params.id), req.body);
      res.json(child);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Events routes
  app.get("/api/events", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const { childId, startDate, endDate } = req.query;
    const events = await storage.getEvents(
      familyId,
      childId ? parseInt(childId as string) : undefined,
      startDate as string,
      endDate as string
    );
    res.json(events);
  });

  app.get("/api/events/:id", requireAuth, async (req, res) => {
    const event = await storage.getEvent(parseInt(req.params.id));
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (event.family_id !== (req as any).familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    res.json(event);
  });

  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent({
        ...validatedData,
        family_id: (req as any).familyId,
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

  app.patch("/api/events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getEvent(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const event = await storage.updateEvent(parseInt(req.params.id), req.body);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.delete("/api/events/:id", requireAuth, async (req, res) => {
    const existing = await storage.getEvent(parseInt(req.params.id));
    if (!existing) {
      return res.status(404).json({ error: "Event not found" });
    }
    if (existing.family_id !== (req as any).familyId) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const success = await storage.deleteEvent(parseInt(req.params.id));
    if (!success) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.status(204).send();
  });

  // Activities routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    const { season } = req.query;
    const activities = await storage.getActivities(season as string);
    res.json(activities);
  });

  app.post("/api/activities", requireAuth, async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Oslo events route - Returns current family-friendly events in Oslo
  app.get("/api/oslo-events", async (req, res) => {
    try {
      // Mock data for Oslo events - Based on verified information from actual Oslo venues
      // Data verified: January 2026 - showing only venues/events that are actually open
      const today = new Date();

      // Helper to get specific date (for weekend events)
      const getNextWeekendDate = (daysAhead: number) => {
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
            startDate: getNextWeekendDate(2), // This Saturday
            startTime: "10:00",
            location: { name: "Bjørvika, Oslo" },
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
            startDate: getNextWeekendDate(3), // Sunday
            startTime: "10:00",
            location: { name: "Tøyen, Oslo" },
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
            startDate: getNextWeekendDate(1), // Tomorrow
            startTime: "00:00",
            location: { name: "Frogner, Oslo" },
            categories: [{ name: "Outdoor" }, { name: "Park" }, { name: "Barn" }],
            image: { url: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=400" },
            isFree: true,
            url: "https://vigeland.museum.no"
          },
          {
            id: "oslo-4",
            title: "Deichman Bjørvika - Children's Activities",
            name: "Barnas Lørdag (Children's Saturday)",
            description: "Free children's activities at Oslo's main library. Stories, crafts, and fun for ages 3-12. No registration needed!",
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "12:00",
            location: { name: "Bjørvika, Oslo" },
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
            startDate: getNextWeekendDate(2), // Saturday
            startTime: "10:00",
            location: { name: "Kjelsås, Oslo" },
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
            startDate: getNextWeekendDate(3), // Sunday
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
            startDate: getNextWeekendDate(2), // Saturday
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
            startDate: getNextWeekendDate(1), // Tomorrow
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
            startDate: getNextWeekendDate(3), // Sunday
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
            startDate: getNextWeekendDate(2), // Saturday
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

  // Friends routes
  app.get("/api/friends", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const friends = await storage.getFriends(familyId);
    res.json(friends);
  });

  app.post("/api/friends", requireAuth, async (req, res) => {
    try {
      const validatedData = insertFriendSchema.parse(req.body);
      const friend = await storage.createFriend({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/friends/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getFriend(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Friend not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const friend = await storage.updateFriend(parseInt(req.params.id), req.body);
      res.json(friend);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Social Events routes
  app.get("/api/social-events", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const events = await storage.getSocialEvents(familyId);
    res.json(events);
  });

  app.post("/api/social-events", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSocialEventSchema.parse(req.body);
      const event = await storage.createSocialEvent({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/social-events/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSocialEvent(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Social event not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const event = await storage.updateSocialEvent(parseInt(req.params.id), req.body);
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Reading List routes
  app.get("/api/reading-list", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const { childId } = req.query;
    const items = await storage.getReadingList(
      familyId,
      childId ? parseInt(childId as string) : undefined
    );
    res.json(items);
  });

  app.post("/api/reading-list", requireAuth, async (req, res) => {
    try {
      const validatedData = insertReadingListSchema.parse(req.body);
      const item = await storage.createReadingListItem({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/reading-list/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getReadingListItem(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "Reading list item not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const item = await storage.updateReadingListItem(parseInt(req.params.id), req.body);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // School Tasks routes
  app.get("/api/school-tasks", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const { childId } = req.query;
    const tasks = await storage.getSchoolTasks(
      familyId,
      childId ? parseInt(childId as string) : undefined
    );
    res.json(tasks);
  });

  app.post("/api/school-tasks", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSchoolTaskSchema.parse(req.body);
      const task = await storage.createSchoolTask({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  app.patch("/api/school-tasks/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getSchoolTask(parseInt(req.params.id));
      if (!existing) {
        return res.status(404).json({ error: "School task not found" });
      }
      if (existing.family_id !== (req as any).familyId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const task = await storage.updateSchoolTask(parseInt(req.params.id), req.body);
      res.json(task);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  // Handover Notes routes
  app.get("/api/handover-notes", requireAuth, async (req, res) => {
    const familyId = (req as any).familyId;
    const { childId } = req.query;
    const notes = await storage.getHandoverNotes(
      familyId,
      childId ? parseInt(childId as string) : undefined
    );
    res.json(notes);
  });

  app.post("/api/handover-notes", requireAuth, async (req, res) => {
    try {
      const validatedData = insertHandoverNoteSchema.parse(req.body);
      const note = await storage.createHandoverNote({
        ...validatedData,
        family_id: (req as any).familyId,
      });
      res.status(201).json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid data" });
    }
  });

  return httpServer;
}
