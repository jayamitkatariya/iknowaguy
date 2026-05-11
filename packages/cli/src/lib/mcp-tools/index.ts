import { z } from "zod";
import type { Config } from "../config.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

async function platformFetch(config: Config, path: string, options: RequestInit = {}): Promise<any> {
  const url = `${config.platform_url}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${config.api_key}`,
    ...(options.headers as Record<string, string> || {}),
  };
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    data = {};
  }
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export function registerAllTools(server: McpServer, config: Config) {
  const fetch = (path: string, options?: RequestInit) => platformFetch(config, path, options);

  // ── Categories ──
  server.tool("list_categories", "List all task categories", {}, async () => {
    const data = await fetch("/api/categories");
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  // ── Bounties ──
  server.tool("create_bounty", "Create a new bounty task for human workers",
    { title: z.string().max(200), description: z.string().max(5000), category_id: z.string().optional(), instructions: z.string().optional(), location_address: z.string().optional(), reward_amount: z.number().optional().default(0), currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD"), deadline: z.string().optional() },
    async (args) => {
      const data = await fetch("/api/bounties", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("list_bounties", "List bounties with filters",
    { status: z.enum(["open", "accepted", "in_progress", "submitted", "completed", "disputed", "cancelled"]).optional(), category_id: z.string().optional(), page: z.number().optional(), limit: z.number().optional() },
    async (args) => {
      const params = new URLSearchParams();
      if (args.status) params.set("status", args.status);
      if (args.category_id) params.set("category_id", args.category_id);
      if (args.page) params.set("page", String(args.page));
      if (args.limit) params.set("limit", String(args.limit));
      const data = await fetch(`/api/bounties?${params}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("get_bounty", "Get a single bounty with details",
    { id: z.string() },
    async (args) => {
      const data = await fetch(`/api/bounties/${args.id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("accept_bounty", "Accept a bounty and assign it to a human",
    { id: z.string(), human_id: z.string() },
    async (args) => {
      const data = await fetch(`/api/bounties/${args.id}/accept`, { method: "POST", body: JSON.stringify({ human_id: args.human_id }) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("submit_bounty", "Submit completed work for a bounty",
    { id: z.string(), content: z.string().max(5000).optional(), media_urls: z.array(z.string()).optional() },
    async (args) => {
      const data = await fetch(`/api/bounties/${args.id}/complete`, { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("review_bounty", "Approve or reject a submitted bounty",
    { id: z.string(), decision: z.enum(["approved", "rejected"]), notes: z.string().max(5000).optional() },
    async (args) => {
      const data = await fetch(`/api/bounties/${args.id}/review`, { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Humans ──
  server.tool("list_humans", "List available human workers", {}, async () => {
    const data = await fetch("/api/humans");
    return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
  });

  server.tool("get_human", "Get a human worker profile by ID",
    { id: z.string() },
    async (args) => {
      const data = await fetch(`/api/humans/${args.id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Messages ──
  server.tool("send_message", "Send a message in a bounty thread",
    { bounty_id: z.string(), content: z.string().max(5000) },
    async (args) => {
      const data = await fetch("/api/messages", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("list_messages", "List messages in a bounty thread",
    { bounty_id: z.string() },
    async (args) => {
      const data = await fetch(`/api/messages/${args.bounty_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Disputes ──
  server.tool("raise_dispute", "Raise a dispute on a bounty",
    { bounty_id: z.string(), reason: z.string().max(200), description: z.string().max(5000).optional(), evidence_urls: z.array(z.string()).optional() },
    async (args) => {
      const data = await fetch("/api/disputes", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Payments ──
  server.tool("initiate_payment", "Initiate payment for a bounty",
    { bounty_id: z.string(), amount: z.number(), currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD") },
    async (args) => {
      const data = await fetch("/api/payments/initiate", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("get_payment_status", "Get payment status for a bounty",
    { bounty_id: z.string() },
    async (args) => {
      const data = await fetch(`/api/payments/status/${args.bounty_id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("release_payment", "Release held payment to a worker",
    { bounty_id: z.string() },
    async (args) => {
      const data = await fetch(`/api/payments/release/${args.bounty_id}`, { method: "POST" });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("refund_payment", "Refund a payment for a bounty",
    { bounty_id: z.string(), reason: z.string().optional() },
    async (args) => {
      const data = await fetch(`/api/payments/refund/${args.bounty_id}`, { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── Connect ──
  server.tool("create_connect_account", "Create Stripe Connect account for a worker",
    { email: z.string(), country: z.string().optional().default("US") },
    async (args) => {
      const data = await fetch("/api/connect/account", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("get_account_link", "Get Stripe onboarding link for a worker",
    { account_id: z.string(), refresh_url: z.string().optional(), return_url: z.string().optional() },
    async (args) => {
      const data = await fetch("/api/connect/account-link", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("transfer_to_worker", "Transfer earnings to a Stripe Connect account",
    { amount: z.number(), human_id: z.string(), currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD") },
    async (args) => {
      const data = await fetch("/api/connect/transfer", { method: "POST", body: JSON.stringify(args) });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool("request_human", "Auto-assign a human to a bounty by specific ID or by searching skills",
    { bounty_id: z.string(), human_id: z.string().optional(), skills: z.array(z.string()).optional() },
    async (args) => {
      let humanId = args.human_id;

      if (!humanId && args.skills?.length) {
        try {
          const humansResp = await fetch("/api/humans");
          const humans = Array.isArray(humansResp) ? humansResp : (humansResp?.data || []);
          const matched = humans.find((h: any) =>
            args.skills!.some((s: string) => h.skills?.includes(s))
          );
          if (matched) humanId = matched.id;
        } catch (err) {
          console.error("Failed to fetch humans for skill matching:", err);
        }
      }

      if (!humanId) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({ error: "No human_id provided and no matching workers found for the given skills" }, null, 2),
          }],
        };
      }

      const data = await fetch(`/api/bounties/${args.bounty_id}/accept`, {
        method: "POST",
        body: JSON.stringify({ human_id: humanId }),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
    }
  );
}
