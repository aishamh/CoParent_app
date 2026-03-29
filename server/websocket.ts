import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import { verifyToken } from "./auth";
import { storage } from "./storage";
import { db } from "./db";
import { messages, deviceTokens } from "./tables";
import { eq, and, desc, lt } from "drizzle-orm";
import { createHash } from "crypto";

let io: Server | null = null;

// Track online users: userId → Set<socketId>
const onlineUsers = new Map<string, Set<string>>();

export function getIO(): Server | null {
  return io;
}

export function setupWebSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: (process.env.ALLOWED_ORIGINS || "http://localhost:5173").split(","),
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // ---------------------------------------------------------------------------
  // Auth middleware — verify JWT on connection
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      return next(new Error("unauthorized"));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error("unauthorized"));
    }

    const user = await storage.getUser(payload.userId);
    if (!user) {
      return next(new Error("unauthorized"));
    }

    // Attach user info to socket
    (socket as any).userId = user.id;
    (socket as any).familyId = user.family_id;
    next();
  });

  // ---------------------------------------------------------------------------
  // Connection handler
  // ---------------------------------------------------------------------------
  io.on("connection", (socket: Socket) => {
    const userId: string = (socket as any).userId;
    const familyId: string | null = (socket as any).familyId;

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join rooms
    socket.join(`user:${userId}`);
    if (familyId) {
      socket.join(`family:${familyId}`);
      // Notify family that user is online
      socket.to(`family:${familyId}`).emit("user:online", { userId });
    }

    console.log(`[WS] ${userId} connected (socket: ${socket.id})`);

    // ---------------------------------------------------------------------------
    // Message: send
    // ---------------------------------------------------------------------------
    socket.on("message:send", async (data, ack) => {
      try {
        const { receiverId, content, subject } = data;
        if (!content || !receiverId) {
          ack?.({ error: "Missing content or receiverId" });
          return;
        }

        const contentHash = createHash("sha256")
          .update(`${userId}:${content}:${Date.now()}`)
          .digest("hex")
          .slice(0, 16);

        const senderFamilyId = familyId || "";

        const [message] = await db
          .insert(messages)
          .values({
            family_id: senderFamilyId,
            sender_id: userId,
            receiver_id: receiverId,
            subject: subject || null,
            content,
            content_hash: contentHash,
            sender_ip: socket.handshake.address,
          })
          .returning();

        // Send to receiver (all their sockets)
        io!.to(`user:${receiverId}`).emit("message:new", message);

        // ACK sender with server-assigned ID
        ack?.({ ok: true, message });

        // If receiver is offline, send push notification
        const receiverSockets = onlineUsers.get(receiverId);
        if (!receiverSockets || receiverSockets.size === 0) {
          sendPushNotification(receiverId, userId, content).catch(() => {});
        }
      } catch (err) {
        console.error("[WS] message:send error:", err);
        ack?.({ error: "Failed to send message" });
      }
    });

    // ---------------------------------------------------------------------------
    // Message: typing indicator
    // ---------------------------------------------------------------------------
    socket.on("message:typing", (data) => {
      const { receiverId } = data;
      if (receiverId) {
        io!.to(`user:${receiverId}`).emit("message:typing", { userId });
      }
    });

    // ---------------------------------------------------------------------------
    // Message: mark as read
    // ---------------------------------------------------------------------------
    socket.on("message:read", async (data) => {
      try {
        const { messageIds } = data;
        if (!Array.isArray(messageIds) || messageIds.length === 0) return;

        const now = new Date().toISOString();
        for (const messageId of messageIds) {
          await db
            .update(messages)
            .set({ is_read: true, read_at: now })
            .where(
              and(
                eq(messages.id, messageId),
                eq(messages.receiver_id, userId),
              ),
            );
        }

        // Notify sender that messages were read
        if (familyId) {
          socket.to(`family:${familyId}`).emit("message:read", {
            messageIds,
            readBy: userId,
            readAt: now,
          });
        }
      } catch (err) {
        console.error("[WS] message:read error:", err);
      }
    });

    // ---------------------------------------------------------------------------
    // Disconnect
    // ---------------------------------------------------------------------------
    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          // Notify family that user went offline
          if (familyId) {
            socket.to(`family:${familyId}`).emit("user:offline", { userId });
          }
        }
      }
      console.log(`[WS] ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  return io;
}

// ---------------------------------------------------------------------------
// Push notification fallback for offline users
// ---------------------------------------------------------------------------
async function sendPushNotification(
  receiverId: string,
  senderId: string,
  content: string,
): Promise<void> {
  // Get receiver's device tokens
  const tokens = await db
    .select()
    .from(deviceTokens)
    .where(
      and(
        eq(deviceTokens.user_id, receiverId),
        eq(deviceTokens.is_active, true),
      ),
    );

  if (tokens.length === 0) return;

  // Get sender's display name
  const sender = await storage.getUser(senderId);
  const senderName = sender?.display_name || sender?.username || "Someone";

  // Truncate content for notification
  const preview = content.length > 100 ? content.slice(0, 97) + "..." : content;

  // Note: APNs integration would go here — for now we log
  console.log(
    `[Push] Would notify ${receiverId} (${tokens.length} devices): "${senderName}: ${preview}"`,
  );
}

/** Check if a user has at least one active WebSocket connection. */
export function isUserOnline(userId: string): boolean {
  const sockets = onlineUsers.get(userId);
  return !!sockets && sockets.size > 0;
}
