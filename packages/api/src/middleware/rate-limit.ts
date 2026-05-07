import type { MiddlewareHandler } from 'hono';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 1000;

const store: Record<string, RateLimitEntry> = {};

setInterval(() => {
  const now = Date.now();
  for (const key of Object.keys(store)) {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  }
}, WINDOW_MS * 2);

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const tenantId = c.req.header('X-Tenant-ID') ?? c.req.header('X-Forwarded-For') ?? 'unknown';
  const now = Date.now();

  if (!store[tenantId] || store[tenantId].resetAt < now) {
    store[tenantId] = { count: 1, resetAt: now + WINDOW_MS };
  } else {
    store[tenantId].count++;
  }

  const { count, resetAt } = store[tenantId];
  const remaining = Math.max(0, MAX_REQUESTS - count);

  c.header('X-RateLimit-Limit', String(MAX_REQUESTS));
  c.header('X-RateLimit-Remaining', String(remaining));
  c.header('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

  if (count > MAX_REQUESTS) {
    return c.json({ error: 'Rate limit exceeded. Try again later.' }, 429);
  }

  await next();
  return;
};