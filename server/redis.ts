import type Redis from "ioredis";

let redis: Redis | null = null;

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const IORedis = require("ioredis") as typeof import("ioredis").default;
    const client = new IORedis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 5) return null; // Stop retrying
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("[Redis] Connection error:", err.message);
    });

    client.on("connect", () => {
      console.log("[Redis] Connected");
    });

    client.connect().catch(() => {
      console.warn("[Redis] Initial connection failed — falling back to in-memory");
      redis = null;
    });

    return client;
  } catch {
    console.warn("[Redis] ioredis not available — using in-memory fallback");
    return null;
  }
}

export function getRedis(): Redis | null {
  if (redis === undefined) {
    redis = createRedisClient();
  }
  return redis;
}

// Initialize on import
redis = createRedisClient();

// ---------------------------------------------------------------------------
// Rate-limit helper: Redis INCR + EXPIRE sliding window
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterMs: number }> {
  const r = getRedis();

  if (r) {
    try {
      const windowSec = Math.ceil(windowMs / 1000);
      const count = await r.incr(key);
      if (count === 1) {
        await r.expire(key, windowSec);
      }
      const ttl = await r.ttl(key);
      const remaining = Math.max(0, maxRequests - count);
      return {
        allowed: count <= maxRequests,
        remaining,
        retryAfterMs: count > maxRequests ? ttl * 1000 : 0,
      };
    } catch {
      // Redis failed — fall through to in-memory
    }
  }

  // In-memory fallback (single-instance only)
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  record.count++;
  const remaining = Math.max(0, maxRequests - record.count);

  if (record.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: record.resetTime - now,
    };
  }

  return { allowed: true, remaining, retryAfterMs: 0 };
}
