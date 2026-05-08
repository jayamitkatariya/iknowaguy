import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import bounties from "../bounties.js";

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockQuery = {
  from: mockFrom.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle.mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
};

vi.mock("../../../lib/supabase.js", () => ({
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
  Env: { Variables: { tenantId: "", apiKey: "" } },
  hashApiKey: (key: string) => key,
}));

function resetMocks() {
  vi.clearAllMocks();
  mockFrom.mockReturnValue(mockQuery);
  mockInsert.mockReturnValue(mockQuery);
  mockUpdate.mockReturnValue(mockQuery);
  mockSelect.mockReturnValue(mockQuery);
  mockEq.mockReturnValue(mockQuery);
  mockSingle.mockReturnValue(mockQuery);
  mockQuery.order.mockReturnThis();
  mockQuery.range.mockReturnThis();
}

describe("Bounty Lifecycle", () => {
  beforeEach(resetMocks);
  afterEach(() => resetMocks());

  describe("POST /api/bounties", () => {
    it("creates a new bounty", async () => {
      const mockBounty = {
        id: "bounty-1",
        title: "Test Bounty",
        description: "Test description",
        reward_amount: 100,
        currency: "USD",
        status: "open",
        tenant_id: "tenant-1",
        created_at: new Date().toISOString(),
      };

      mockInsert.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockBounty, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          title: "Test Bounty",
          description: "Test description",
          reward_amount: 100,
        }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.id).toBe("bounty-1");
      expect(body.data.status).toBe("open");
    });

    it("validates required fields", async () => {
      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          title: "", // Empty title should fail
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Validation failed");
    });

    it("validates positive reward amount", async () => {
      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          title: "Test Bounty",
          description: "Test description",
          reward_amount: -50, // Negative should fail
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/bounties/:id/accept", () => {
    it("accepts an open bounty", async () => {
      const mockUpdatedBounty = {
        id: "bounty-1",
        status: "accepted",
        assigned_human_id: "human-1",
        tenant_id: "tenant-1",
      };

      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockUpdatedBounty, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          human_id: "human-1",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("accepted");
      expect(body.data.assigned_human_id).toBe("human-1");
    });

    it("returns 409 if bounty is not available", async () => {
      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          human_id: "human-1",
        }),
      });

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error).toBe("Bounty is not available for acceptance");
    });

    it("validates human_id format", async () => {
      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          human_id: "not-a-uuid",
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/bounties/:id/complete", () => {
    it("completes a bounty with submission", async () => {
      // First query to get assigned human
      mockEq.mockImplementation((col) => {
        if (col === "id") {
          return {
            ...mockQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: "bounty-1", assigned_human_id: "human-1" },
              error: null,
            }),
          };
        }
        return mockQuery;
      });

      const mockSubmission = {
        id: "sub-1",
        bounty_id: "bounty-1",
        human_id: "human-1",
        content: "Task completed!",
        status: "submitted",
      };

      const mockCompletedBounty = {
        id: "bounty-1",
        status: "submitted",
      };

      mockInsert.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockSubmission, error: null }),
      }));

      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockCompletedBounty, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          content: "Task completed!",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("submitted");
      expect(body.submission.content).toBe("Task completed!");
    });

    it("returns 400 if bounty has no assigned human", async () => {
      mockEq.mockImplementation((col) => {
        if (col === "id") {
          return {
            ...mockQuery,
            single: vi.fn().mockResolvedValue({
              data: { id: "bounty-1", assigned_human_id: null },
              error: null,
            }),
          };
        }
        return mockQuery;
      });

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          content: "Task completed!",
        }),
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe("Bounty has no assigned human");
    });
  });

  describe("POST /api/bounties/:id/review", () => {
    it("approves a bounty submission", async () => {
      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockReturnThis(),
        // First call for submission update
      }));

      const mockApprovedBounty = {
        id: "bounty-1",
        status: "completed",
      };

      // Mock for both update calls
      let callCount = 0;
      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockImplementation(() => ({
          ...mockQuery,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockApprovedBounty,
            error: null,
          }),
        })),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          decision: "approved",
          notes: "Great work!",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("completed");
    });

    it("rejects a bounty submission", async () => {
      const mockRejectedBounty = {
        id: "bounty-1",
        status: "open",
      };

      mockUpdate.mockImplementation(() => ({
        ...mockQuery,
        eq: vi.fn().mockImplementation(() => ({
          ...mockQuery,
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockRejectedBounty,
            error: null,
          }),
        })),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          decision: "rejected",
          notes: "Needs revision",
        }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.status).toBe("open");
    });

    it("validates decision enum", async () => {
      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties/bounty-1/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-key",
        },
        body: JSON.stringify({
          decision: "maybe", // Invalid
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/bounties", () => {
    it("returns paginated bounties", async () => {
      const mockBounties = [
        { id: "bounty-1", title: "Bounty 1", status: "open" },
        { id: "bounty-2", title: "Bounty 2", status: "open" },
      ];

      mockSelect.mockImplementation(() => ({
        ...mockQuery,
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockBounties, error: null }),
      }));

      mockEq.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockBounties, error: null }),
        // For count query
        single: vi.fn().mockResolvedValue({ count: 2, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties", {
        headers: {
          Authorization: "Bearer valid-key",
        },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
    });

    it("filters by status", async () => {
      mockSelect.mockImplementation(() => ({
        ...mockQuery,
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      }));

      mockEq.mockImplementation(() => ({
        ...mockQuery,
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
        single: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }));

      const app = new Hono();
      const { apiKeyMiddleware } = await import("../../middleware/api-key.js");
      app.use("/api/*", apiKeyMiddleware);
      app.route("/api", bounties);

      const res = await app.request("/api/bounties?status=open", {
        headers: {
          Authorization: "Bearer valid-key",
        },
      });

      expect(res.status).toBe(200);
    });
  });
});
