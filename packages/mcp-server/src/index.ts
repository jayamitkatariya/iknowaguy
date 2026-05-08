import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import express, { Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";
import { z } from "zod";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { authMiddleware } from "./auth.js";
import { getSupabaseClient } from "./lib/supabase.js";
import { constructWebhookEvent } from "./lib/stripe.js";
import { sseEmitter } from "./lib/sse.js";

import { registerHumanTools } from "./tools/humans.js";
import { registerBountyTools } from "./tools/bounties.js";
import { registerMessageTools } from "./tools/messages.js";
import { registerDisputeTools } from "./tools/disputes.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerCategoryTools } from "./tools/categories.js";

import {
  handleListCategories,
  handleGetCategory,
  CategoryListSchema,
  CategoryGetSchema,
} from "./tools/categories.js";
import {
  handleListHumans,
  handleGetHuman,
  handleRequestHuman,
  HumanListSchema,
  HumanGetSchema,
  HumanRequestSchema,
} from "./tools/humans.js";
import {
  handleCreateBounty,
  handleListBounties,
  handleGetBounty,
  handleAcceptBounty,
  handleSubmitBounty,
  handleReviewBounty,
  BountyCreateSchema,
  BountyListSchema,
  BountyGetSchema,
  BountyAcceptSchema,
  BountySubmitSchema,
  BountyReviewSchema,
} from "./tools/bounties.js";
import {
  handleSendMessage,
  handleListMessages,
  MessageSendSchema,
  MessageListSchema,
} from "./tools/messages.js";
import { handleRaiseDispute, DisputeRaiseSchema } from "./tools/disputes.js";
import {
  handleInitiatePayment,
  handleGetPaymentStatus,
  handleReleasePayment,
  handleRefundPayment,
  PaymentInitiateSchema,
  PaymentStatusSchema,
  PaymentReleaseSchema,
  PaymentRefundSchema,
} from "./tools/payments.js";

// ── Shared MCP server instance ─────────────────────────────────────────────────
const server = new McpServer({
  name: "hireahuman",
  version: "0.1.0",
});

registerHumanTools(server);
registerBountyTools(server);
registerMessageTools(server);
registerDisputeTools(server);
registerPaymentTools(server);
registerCategoryTools(server);

// ── HTTP mode ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || "3001");
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim()) || [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
];

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// Augment Express Request to include tenant
declare global {
  namespace Express {
    interface Request {
      id?: string;
      tenant?: Tenant;
    }
  }
}

const app = express();

app.use(requestIdMiddleware);
app.use(loggerMiddleware);
app.use(rateLimitMiddleware);

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ── Stripe webhook (must be before express.json() to read raw body) ──────────
app.post("/webhooks/stripe", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const rawBody = req.body as Buffer;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    return res.status(400).json({ error: "Missing stripe-signature header" });
  }

  if (!secret) {
    console.warn("[webhook] STRIPE_WEBHOOK_SECRET not set, skipping verification");
    return res.status(400).json({ error: "Webhook secret not configured" });
  }

  try {
    const event = constructWebhookEvent(rawBody, sig, secret);

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
      console.log("[webhook] PaymentIntent succeeded:", paymentIntent.id);

      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ status: "succeeded", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (updateError) {
        console.error("[webhook] Failed to update payment_transaction:", updateError.message);
      }

      // Broadcast SSE event if this belongs to a bounty
      const bountyId = paymentIntent.metadata?.bounty_id;
      const tenantId = paymentIntent.metadata?.tenant_id;
      if (bountyId && tenantId) {
        sseEmitter.broadcast("bounty.accepted", tenantId, { bounty_id: bountyId, payment_status: "succeeded" });
      }
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
      console.log("[webhook] PaymentIntent failed:", paymentIntent.id);

      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (updateError) {
        console.error("[webhook] Failed to update payment_transaction:", updateError.message);
      }

      // Broadcast SSE event if this belongs to a bounty
      const bountyId = paymentIntent.metadata?.bounty_id;
      const tenantId = paymentIntent.metadata?.tenant_id;
      if (bountyId && tenantId) {
        sseEmitter.broadcast("bounty.cancelled", tenantId, { bounty_id: bountyId, payment_status: "failed" });
      }
    }

    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object as { id: string; metadata?: Record<string, string> };
      console.log("[webhook] PaymentIntent canceled:", paymentIntent.id);

      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase
        .from("payment_transactions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_payment_intent_id", paymentIntent.id);

      if (updateError) {
        console.error("[webhook] Failed to update payment_transaction:", updateError.message);
      }
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error("[webhook] Error verifying webhook:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }
});

app.use(express.json());

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.0" });
});

// ── SSE realtime events ───────────────────────────────────────────────────────
/**
 * GET /events
 * SSE endpoint for realtime bounty state-change notifications.
 * Clients receive events as server-sent events (text/event-stream).
 *
 * Query params:
 *   - tenant_id (optional): Subscribe only to events for a specific tenant.
 *                            If omitted, client receives all events.
 *
 * Events broadcast:
 *   bounty.created, bounty.accepted, bounty.submitted,
 *   bounty.approved, bounty.rejected, bounty.disputed,
 *   bounty.cancelled, bounty.refunded
 *
 * Example client:
 *   const es = new EventSource("http://localhost:3001/events?tenant_id=tenant_123");
 *   es.addEventListener("bounty.created", (e) => {
 *     const data = JSON.parse(e.data);
 *     console.log("New bounty:", data.data);
 *   });
 */
app.get("/events", authMiddleware, (req: Request, res: Response) => {
  const tenantId = typeof req.query.tenant_id === "string" ? req.query.tenant_id : req.tenant?.id ?? null;
  const clientId = sseEmitter.addClient(tenantId, res);

  // Keepalive: send a comment every 25s to prevent proxy timeouts
  const keepalive = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(keepalive);
    }
  }, 25_000);

  req.on("close", () => {
    clearInterval(keepalive);
    sseEmitter.removeClient(clientId);
  });
});

// ── Tool routing map ─────────────────────────────────────────────────────────
const toolHandlers: Record<string, (args: any, tenantId: string) => Promise<any>> = {
  list_categories: handleListCategories,
  get_category: handleGetCategory,
  list_humans: handleListHumans,
  get_human: handleGetHuman,
  request_human: handleRequestHuman,
  create_bounty: handleCreateBounty,
  list_bounties: handleListBounties,
  get_bounty: handleGetBounty,
  accept_bounty: handleAcceptBounty,
  submit_bounty: handleSubmitBounty,
  review_bounty: handleReviewBounty,
  send_message: handleSendMessage,
  list_messages: handleListMessages,
  raise_dispute: handleRaiseDispute,
  initiate_payment: handleInitiatePayment,
  get_payment_status: handleGetPaymentStatus,
  release_payment: handleReleasePayment,
  refund_payment: handleRefundPayment,
};

// ── Tool schema definitions for tools/list ───────────────────────────────────
const toolDefinitions = [
  {
    name: "list_categories",
    description: "List all available categories",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max results" },
        offset: { type: "number", description: "Offset for pagination" },
      },
    },
  },
  {
    name: "get_category",
    description: "Get a specific category by ID or slug",
    inputSchema: {
      type: "object",
      properties: {
        category_id: { type: "string", description: "Category UUID or slug" },
      },
      required: ["category_id"],
    },
  },
  {
    name: "list_humans",
    description: "List available human workers with optional filters for skills, location, and verification status",
    inputSchema: {
      type: "object",
      properties: {
        skills: { type: "array", items: { type: "string" }, description: "Filter by skills (array overlap)" },
        location_city: { type: "string", description: "Filter by city" },
        location_country: { type: "string", description: "Filter by country" },
        verification_status: { type: "string", description: "Filter by verification status" },
        limit: { type: "number", description: "Number of results" },
        offset: { type: "number", description: "Offset for pagination" },
      },
    },
  },
  {
    name: "get_human",
    description: "Get full profile details for a specific human worker by ID",
    inputSchema: {
      type: "object",
      properties: {
        human_id: { type: "string", description: "ID of the human worker (human_profiles.id)" },
      },
      required: ["human_id"],
    },
  },
  {
    name: "request_human",
    description: "Create an internal task bounty assigned to a specific human (or auto-select by skills) and notify them",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the task request" },
        description: { type: "string", description: "Description of the task" },
        instructions: { type: "string", description: "Step-by-step instructions for the human" },
        target_human_id: { type: "string", description: "Specific human to request" },
        skills: { type: "array", items: { type: "string" }, description: "Required skills (used only if target_human_id not provided)" },
        location_address: { type: "string", description: "Task location address" },
        location_lat: { type: "number", description: "Task latitude" },
        location_lng: { type: "number", description: "Task longitude" },
        reward_amount: { type: "number", description: "Reward amount in USD" },
        deadline: { type: "string", description: "ISO 8601 deadline" },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "create_bounty",
    description: "Create a new bounty task for human workers to accept",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title of the bounty" },
        description: { type: "string", description: "Detailed description" },
        instructions: { type: "string", description: "Step-by-step instructions for the human" },
        category_id: { type: "string", description: "Category UUID" },
        template_id: { type: "string", description: "Template UUID" },
        location_address: { type: "string", description: "Street address" },
        location_lat: { type: "number", description: "Latitude" },
        location_lng: { type: "number", description: "Longitude" },
        reward_amount: { type: "number", description: "Reward amount in USD" },
        currency: { type: "string", enum: ["USD", "EUR", "GBP", "INR"], description: "Currency" },
        deadline: { type: "string", description: "ISO 8601 deadline" },
      },
      required: ["title", "description"],
    },
  },
  {
    name: "list_bounties",
    description: "List bounties with optional status and category filters",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["open", "accepted", "in_progress", "submitted", "reviewing", "completed", "disputed", "cancelled", "refunded"], description: "Filter by status" },
        category_id: { type: "string", description: "Filter by category UUID" },
        assigned_human_id: { type: "string", description: "Filter by assigned human" },
        limit: { type: "number", description: "Number of results" },
        offset: { type: "number", description: "Offset for pagination" },
      },
    },
  },
  {
    name: "get_bounty",
    description: "Get a single bounty with details",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the bounty" },
      },
      required: ["id"],
    },
  },
  {
    name: "accept_bounty",
    description: "Accept a bounty and assign it to a human worker",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the bounty to accept" },
        assigned_human_id: { type: "string", description: "ID of the human accepting" },
      },
      required: ["id", "assigned_human_id"],
    },
  },
  {
    name: "submit_bounty",
    description: "Submit a completed bounty with evidence (photos/notes)",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the bounty to submit" },
        content: { type: "string", description: "Submission notes/description" },
        media_urls: { type: "array", items: { type: "string" }, description: "Array of photo/video URL strings" },
      },
      required: ["id"],
    },
  },
  {
    name: "review_bounty",
    description: "Approve or reject a submitted bounty",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID of the bounty to review" },
        decision: { type: "string", enum: ["approved", "rejected"], description: "Review decision" },
        notes: { type: "string", description: "Review notes" },
      },
      required: ["id", "decision"],
    },
  },
  {
    name: "send_message",
    description: "Send a message in a bounty thread",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty thread" },
        sender_id: { type: "string", description: "ID of the message sender" },
        content: { type: "string", description: "Message content" },
      },
      required: ["bounty_id", "sender_id", "content"],
    },
  },
  {
    name: "list_messages",
    description: "List messages for a bounty thread ordered by creation time",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty thread" },
        limit: { type: "number", description: "Number of results" },
        offset: { type: "number", description: "Offset for pagination" },
      },
      required: ["bounty_id"],
    },
  },
  {
    name: "raise_dispute",
    description: "Raise a dispute on a bounty and update its status to disputed",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty" },
        raised_by: { type: "string", description: "ID of the user raising the dispute" },
        reason: { type: "string", description: "Reason for the dispute" },
        evidence_urls: { type: "array", items: { type: "string" }, description: "Evidence URLs" },
      },
      required: ["bounty_id", "raised_by", "reason"],
    },
  },
  {
    name: "initiate_payment",
    description: "Initiate a payment for a bounty",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty" },
        amount: { type: "number", description: "Payment amount" },
        currency: { type: "string", enum: ["USD", "EUR", "GBP", "INR"], description: "Currency" },
      },
      required: ["bounty_id", "amount"],
    },
  },
  {
    name: "get_payment_status",
    description: "Get the current payment status for a bounty",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty" },
      },
      required: ["bounty_id"],
    },
  },
  {
    name: "release_payment",
    description: "Release payment for a completed bounty",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty" },
      },
      required: ["bounty_id"],
    },
  },
  {
    name: "refund_payment",
    description: "Refund payment for a bounty",
    inputSchema: {
      type: "object",
      properties: {
        bounty_id: { type: "string", description: "ID of the bounty" },
        reason: { type: "string", description: "Reason for refund" },
      },
      required: ["bounty_id"],
    },
  },
];

// ── Tool schema map for Zod validation ──────────────────────────────────────────
const toolSchemas: Record<string, z.ZodTypeAny> = {
  list_categories: CategoryListSchema,
  get_category: CategoryGetSchema,
  list_humans: HumanListSchema,
  get_human: HumanGetSchema,
  request_human: HumanRequestSchema,
  create_bounty: BountyCreateSchema,
  list_bounties: BountyListSchema,
  get_bounty: BountyGetSchema,
  accept_bounty: BountyAcceptSchema,
  submit_bounty: BountySubmitSchema,
  review_bounty: BountyReviewSchema,
  send_message: MessageSendSchema,
  list_messages: MessageListSchema,
  raise_dispute: DisputeRaiseSchema,
  initiate_payment: PaymentInitiateSchema,
  get_payment_status: PaymentStatusSchema,
  release_payment: PaymentReleaseSchema,
  refund_payment: PaymentRefundSchema,
};

// ── JSON-RPC helpers ─────────────────────────────────────────────────────────
function jsonRpcSuccess(id: string | number | null, result: any) {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: string | number | null, code: number, message: string, data?: any) {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data ? { data } : {}) } };
}

// ── MCP JSON-RPC handler ─────────────────────────────────────────────────────
app.post("/mcp", authMiddleware, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const { method, params, id } = body;

    if (!method) {
      return res.status(400).json(jsonRpcError(id ?? null, -32600, "Invalid Request: missing method"));
    }

    // Per JSON-RPC spec, requests with null/undefined id are notifications — no response
    if (id === null || id === undefined) {
      if (method === "notifications/initialized") {
        return res.status(204).end();
      }
      // For any other notification, process silently and return 200 with empty body
      return res.status(200).end();
    }

    // ── initialize ───────────────────────────────────────────────────────────
    if (method === "initialize") {
      return res.json(
        jsonRpcSuccess(id, {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: "hireahuman",
            version: "0.1.0",
          },
        })
      );
    }

    // ── ping ─────────────────────────────────────────────────────────────────
    if (method === "ping") {
      return res.json(jsonRpcSuccess(id, {}));
    }

    // ── tools/list ───────────────────────────────────────────────────────────
    if (method === "tools/list") {
      return res.json(jsonRpcSuccess(id, { tools: toolDefinitions }));
    }

    // ── tools/call ───────────────────────────────────────────────────────────
    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};

      if (!toolName) {
        return res.status(400).json(jsonRpcError(id ?? null, -32602, "Invalid params: missing name"));
      }

      const handler = toolHandlers[toolName];
      if (!handler) {
        return res.status(404).json(jsonRpcError(id ?? null, -32601, `Tool not found: ${toolName}`));
      }

      const tenantId = req.tenant!.id;

      let validatedArgs = toolArgs;
      const schema = toolSchemas[toolName];
      if (schema) {
        const parsed = schema.safeParse(toolArgs);
        if (!parsed.success) {
          const errors = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
          return res.status(400).json(jsonRpcError(id ?? null, -32602, `Invalid params: ${errors}`));
        }
        validatedArgs = parsed.data;
      }

      const result = await handler(validatedArgs, tenantId);

      // Convert MCP result format to JSON-RPC result
      return res.json(jsonRpcSuccess(id, result));
    }

    // ── Unknown method ───────────────────────────────────────────────────────
    return res.status(400).json(jsonRpcError(id ?? null, -32601, `Method not found: ${method}`));
  } catch (error: any) {
    console.error("[mcp] Error handling request:", error);
    const id = req.body?.id ?? null;
    return res.status(500).json(jsonRpcError(id, -32603, "Internal error", error?.message));
  }
});

// ── Environment validation ───────────────────────────────────────────────────
function validateEnv(): void {
  const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

// ── Stdio mode ────────────────────────────────────────────────────────────────
async function runStdio() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("HireAHuman MCP server running on stdio");
}

// ── HTTP mode ─────────────────────────────────────────────────────────────────
async function runHttp() {
  validateEnv();
  const httpServer = createServer(app);
  httpServer.listen(PORT, () => {
    console.log(`HireAHuman MCP HTTP server running on port ${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

// ── Main entry point ─────────────────────────────────────────────────────────
const useStdio = process.argv.includes("--stdio");

async function main() {
  if (useStdio) {
    await runStdio();
  } else {
    await runHttp();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

export { server };
