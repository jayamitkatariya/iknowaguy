import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 100;

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

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
