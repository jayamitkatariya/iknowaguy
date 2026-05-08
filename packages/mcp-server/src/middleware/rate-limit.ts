import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;

const REDIS_URL = process.env.REDIS_URL;

let redis: unknown = null;
let redisInitPromise: Promise<void> | null = null;
const store = new Map<string, RateLimitEntry>();

function initRedis(): Promise<void> {
  if (redisInitPromise) return redisInitPromise;
  redisInitPromise = (async () => {
    if (!REDIS_URL) return;
    try {
      const ioredis = await import("ioredis");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Redis: any = ioredis.default || ioredis.Redis;
      redis = new Redis(REDIS_URL);
      (redis as any).on("error", () => {});
      (redis as any).on("connect", () => {
        console.log("[rate-limit] Connected to Redis for rate limiting");
      });
    } catch {
      // Redis not available, using in-memory fallback
    }
  })();
  return redisInitPromise;
}

initRedis();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  await initRedis();
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const key = `ratelimit:${ip}`;

  if (redis) {
    try {
      const raw = await (redis as any).get(key);
      if (raw) {
        const entry: RateLimitEntry = JSON.parse(raw);
        if (now > entry.resetTime) {
          const newEntry = { count: 1, resetTime: now + WINDOW_MS };
          await (redis as any).set(key, JSON.stringify(newEntry), "PX", WINDOW_MS);
          return next();
        }
        if (entry.count >= MAX_REQUESTS) {
          return res.status(429).json({ error: "Too many requests, please try again later." });
        }
        entry.count++;
        await (redis as any).set(key, JSON.stringify(entry), "PX", Math.max(1, entry.resetTime - now));
        return next();
      }
      const newEntry = { count: 1, resetTime: now + WINDOW_MS };
      await (redis as any).set(key, JSON.stringify(newEntry), "PX", WINDOW_MS);
      return next();
    } catch (err) {
      console.warn("[rate-limit] Redis error, falling back to in-memory:", (err as Error).message);
    }
  }

  const entry = store.get(ip);
  if (!entry || now > entry.resetTime) {
    store.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests, please try again later." });
  }

  entry.count++;
  next();
}