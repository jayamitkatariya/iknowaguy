import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import humans from "../humans.js";

const mockQuery = {
  from: vi.fn(() => mockQuery),
  select: vi.fn(() => mockQuery),
  eq: vi.fn(() => mockQuery),
  order: vi.fn(() => mockQuery),
  single: vi.fn(() => mockQuery),
};

vi.mock("../../lib/supabase.js", () => ({
  supabase: mockQuery,
}));

vi.mock("../../middleware/api-key.js", () => ({
  apiKeyMiddleware: async (c: any, next: any) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "Missing or invalid Authorization header" }, 401);
    }
    const apiKey = authHeader.slice(7);
    if (apiKey === "valid-key") {
      c.set("tenantId", "tenant-1");
      c.set("apiKey", apiKey);
    } else {
      return c.json({ error: "Invalid API key" }, 401);
    }
    await next();
  },
  Env: {},
}));

async function createApp() {
  const app = new Hono();
  const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
  app.use("/api/*", apiKeyMiddleware);
  app.route("/api", humans);
  return app;
}

describe("GET /api/humans", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    const app = new Hono();
    const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
    app.use("/api/*", apiKeyMiddleware);
    app.route("/api", humans);

    const res = await app.request("/api/humans", {
      headers: {},
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

it("returns data for authenticated requests with valid API key", async () => {
    mockQuery.select.mockImplementation(() => mockQuery);
    mockQuery.eq.mockImplementation(() => mockQuery);
    mockQuery.order.mockResolvedValueOnce({
      data: [
        { id: "h1", full_name: "Alice", rating: 4.8 },
        { id: "h2", full_name: "Bob", rating: 4.5 },
      ],
      error: null,
    });

    const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
    const app = new Hono();
    app.use("/api/*", apiKeyMiddleware);
    app.route("/api", humans);

    const res = await app.request("/api/humans", {
      headers: {
        Authorization: "Bearer valid-key",
      },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("returns 401 with invalid API key", async () => {
    const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
    const app = new Hono();
    app.use("/api/*", apiKeyMiddleware);
    app.route("/api", humans);

    const res = await app.request("/api/humans", {
      headers: {
        Authorization: "Bearer invalid-key",
      },
    });

    expect(res.status).toBe(401);
  });
});