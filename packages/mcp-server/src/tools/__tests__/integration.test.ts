import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  Server } from "@modelcontextprotocol/sdk/sdk.js";
import { handleCreateBounty, handleListBounties, handleAcceptBounty } from "../bounties.js";

const mockFrom = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();

const mockQuery = {
  from: mockFrom.mockReturnThis(),
  insert: mockInsert.mockReturnThis(),
  update: mockUpdate.mockReturnThis(),
  select: mockSelect.mockReturnThis(),
  eq: mockEq.mockReturnThis(),
  single: mockSingle.mockReturnThis(),
  order: mockOrder.mockReturnThis(),
  range: mockRange.mockReturnThis(),
};

vi.mock("../../lib/supabase.js", () => ({
  getSupabaseClient: () => mockQuery,
  _mockQuery: mockQuery,
}));

vi.mock("../../lib/notifications.js", () => ({
  notifyBountyCreated: vi.fn().mockResolvedValue(undefined),
  notifyBountyAccepted: vi.fn().mockResolvedValue(undefined),
  notifyBountySubmitted: vi.fn().mockResolvedValue(undefined),
  notifyBountyApproved: vi.fn().mockResolvedValue(undefined),
  notifyBountyRejected: vi.fn().mockResolvedValue(undefined),
}));

describe("MCP Bounty Tools - Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue(mockQuery);
    mockInsert.mockReturnValue(mockQuery);
    mockUpdate.mockReturnValue(mockQuery);
    mockSelect.mockReturnValue(mockQuery);
    mockEq.mockReturnValue(mockQuery);
    mockSingle.mockReturnValue(mockQuery);
    mockOrder.mockReturnValue(mockQuery);
    mockRange.mockReturnValue(mockQuery);
  });

  describe("handleCreateBounty", () => {
    it("creates a bounty and triggers notification", async () => {
      const { notifyBountyCreated } = await import("../../lib/notifications.js");

      mockSingle.mockResolvedValueOnce({
        data: {
          id: "bounty-123",
          title: "Test Bounty",
          description: "Test Description",
          status: "open",
          reward_amount: 100,
          tenant_id: "tenant-1",
          created_at: new Date().toISOString(),
        },
        error: null,
      });

      const result = await handleCreateBounty(
        {
          title: "Test Bounty",
          description: "Test Description",
          reward_amount: 100,
          tenant_id: "tenant-1",
        },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.bounty.id).toBe("bounty-123");
      expect(parsed.bounty.status).toBe("open");
      expect(notifyBountyCreated).toHaveBeenCalledWith("bounty-123", "tenant-1");
    });

    it("validates required fields before database call", async () => {
      const result = await handleCreateBounty(
        {
          title: "", // Empty title should fail
          description: "Test",
          tenant_id: "tenant-1",
        },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toBeDefined();
      expect(parsed.error).toContain("title");
    });
  });

  describe("handleListBounties", () => {
    it("returns paginated results with metadata", async () => {
      mockRange.mockResolvedValueOnce({
        data: [
          { id: "b1", title: "Bounty 1", status: "open" },
          { id: "b2", title: "Bounty 2", status: "open" },
        ],
        count: 50,
        error: null,
      });

      const result = await handleListBounties(
        { page: 1, limit: 10 },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.bounties).toHaveLength(2);
      expect(parsed.total).toBe(50);
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(10);
    });

    it("filters by status", async () => {
      mockRange.mockResolvedValueOnce({
        data: [{ id: "b1", title: "Open Bounty", status: "open" }],
        count: 1,
        error: null,
      });

      const result = await handleListBounties(
        { status: "open" },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.bounties[0].status).toBe("open");
    });
  });

  describe("handleAcceptBounty", () => {
    it("accepts a bounty and updates status", async () => {
      const { notifyBountyAccepted } = await import("../../lib/notifications.js");

      // First call - check bounty exists and is open
      mockSingle.mockResolvedValueOnce({
        data: { id: "bounty-1", status: "open", tenant_id: "tenant-1" },
        error: null,
      });

      // Update call
      mockSingle.mockResolvedValueOnce({
        data: {
          id: "bounty-1",
          status: "accepted",
          assigned_human_id: "human-1",
        },
        error: null,
      });

      const result = await handleAcceptBounty(
        { id: "bounty-1", human_id: "human-1" },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.bounty.status).toBe("accepted");
      expect(parsed.bounty.assigned_human_id).toBe("human-1");
      expect(notifyBountyAccepted).toHaveBeenCalled();
    });

    it("rejects acceptance of non-open bounty", async () => {
      mockSingle.mockResolvedValueOnce({
        data: { id: "bounty-1", status: "completed", tenant_id: "tenant-1" },
        error: null,
      });

      const result = await handleAcceptBounty(
        { id: "bounty-1", human_id: "human-1" },
        "tenant-1"
      );

      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.error).toContain("not available");
    });
  });
});

describe("MCP Server Initialization", () => {
  it("should export tools with correct structure", async () => {
    const tools = await import("../index.js");
    
    expect(tools.bountyTools).toBeDefined();
    expect(Array.isArray(tools.bountyTools)).toBe(true);
    
    // Each tool should have name, description, inputSchema
    for (const tool of tools.bountyTools) {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe("string");
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
    }
  });
});
