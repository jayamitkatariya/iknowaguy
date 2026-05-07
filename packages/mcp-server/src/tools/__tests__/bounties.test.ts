import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  handleCreateBounty,
  handleListBounties,
  handleReviewBounty,
} from "../bounties.js";

vi.mock("../../lib/supabase.js", () => {
  const chainable = () => mockQuery;
  const mockQuery = {
    from: vi.fn((table: string) => {
      queryLog.push(table);
      return mockQuery;
    }),
    insert: vi.fn(() => mockQuery),
    update: vi.fn(() => mockQuery),
    select: vi.fn(() => mockQuery),
    eq: vi.fn(() => mockQuery),
    single: vi.fn(() => mockQuery),
    order: vi.fn(() => mockQuery),
    range: vi.fn(() => mockQuery),
    limit: vi.fn(() => mockQuery),
  };
  const queryLog: string[] = [];
  return {
    getSupabaseClient: () => mockQuery,
    _queryLog: queryLog,
    _mockQuery: mockQuery,
  };
});

vi.mock("../../lib/notifications.js", () => ({
  notifyBountyCreated: vi.fn(),
  notifyBountyAccepted: vi.fn(),
  notifyBountySubmitted: vi.fn(),
  notifyBountyApproved: vi.fn(),
  notifyBountyRejected: vi.fn(),
}));

import { getSupabaseClient, _mockQuery } from "../../lib/supabase.js";

describe("handleCreateBounty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires tenantId and validates input", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;
    mockSingle.mockResolvedValueOnce({
      data: {
        id: "bounty-1",
        tenant_id: "tenant-1",
        title: "Test Bounty",
        status: "open",
      },
      error: null,
    });

    const result = await handleCreateBounty(
      {
        title: "Test Bounty",
        description: "A test bounty description",
        tenant_id: "tenant-1",
      },
      "tenant-1"
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.bounty.title).toBe("Test Bounty");
    expect(parsed.message).toBe("Bounty created successfully");
  });

  it("rejects empty title via Zod validaion", async () => {
    const { BountyCreateSchema } = await import("../bounties.js");
    const result = BountyCreateSchema.safeParse({
      title: "",
      description: "desc",
      tenant_id: "tenant-1",
    });
    expect(result.success).toBe(false);
  });

  it("returns error when supabase insert fails", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Insert failed" },
    });

    const result = await handleCreateBounty(
      {
        title: "Test Bounty",
        description: "desc",
        tenant_id: "tenant-1",
      },
      "tenant-1"
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe("Insert failed");
  });
});

describe("handleListBounties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns bounties array", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;

    _mockQuery.select.mockImplementation(() => ({
      ..._mockQuery,
      eq: vi.fn(() => ({
        ..._mockQuery,
        order: vi.fn(() => ({
          ..._mockQuery,
          range: vi.fn(() =>
            Promise.resolve({
              data: [
                { id: "b1", title: "Bounty 1", status: "open" },
                { id: "b2", title: "Bounty 2", status: "open" },
              ],
              error: null,
              count: 2,
            })
          ),
        })),
      })),
    }));

    const result = await handleListBounties({}, "tenant-1");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.bounties).toBeDefined();
    expect(Array.isArray(parsed.bounties)).toBe(true);
    expect(parsed.total).toBe(2);
  });

  it("returns empty array when no bounties exist", async () => {
    _mockQuery.select.mockImplementation(() => ({
      ..._mockQuery,
      eq: vi.fn(() => ({
        ..._mockQuery,
        order: vi.fn(() => ({
          ..._mockQuery,
          range: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
              count: 0,
            })
          ),
        })),
      })),
    }));

    const result = await handleListBounties({}, "tenant-1");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.bounties).toEqual([]);
    expect(parsed.total).toBe(0);
  });
});

describe("handleReviewBounty", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets status to revision_requested when decision is rejected", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;
    const mockEq = _mockQuery.eq as ReturnType<typeof vi.fn>;

    mockSingle
      .mockResolvedValueOnce({
        data: { id: "sub-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "bounty-1",
          status: "revision_requested",
          assigned_human_id: "human-1",
        },
        error: null,
      });

    mockEq.mockImplementation(() => _mockQuery);

    const result = await handleReviewBounty(
      { id: "bounty-1", decision: "rejected", notes: "Needs more work" },
      "tenant-1"
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.bounty.status).toBe("revision_requested");
    expect(parsed.review_decision).toBe("rejected");
  });

  it("sets status to completed when decision is approved", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;
    const mockEq = _mockQuery.eq as ReturnType<typeof vi.fn>;

    mockSingle
      .mockResolvedValueOnce({
        data: { id: "sub-1" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          id: "bounty-1",
          status: "completed",
          assigned_human_id: "human-1",
        },
        error: null,
      });

    mockEq.mockImplementation(() => _mockQuery);

    const result = await handleReviewBounty(
      { id: "bounty-1", decision: "approved" },
      "tenant-1"
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.bounty.status).toBe("completed");
    expect(parsed.review_decision).toBe("approved");
  });

  it("returns error when no submission found", async () => {
    const mockSingle = _mockQuery.single as ReturnType<typeof vi.fn>;
    const mockEq = _mockQuery.eq as ReturnType<typeof vi.fn>;

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "No submission found" },
    });

    mockEq.mockImplementation(() => _mockQuery);

    const result = await handleReviewBounty(
      { id: "bounty-1", decision: "approved" },
      "tenant-1"
    );

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBeDefined();
  });
});