import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { sanitizeInput } from "../lib/utils.js";
import { sseEmitter } from "../lib/sse.js";
import {
  notifyBountyCreated,
  notifyBountyAccepted,
  notifyBountySubmitted,
  notifyBountyApproved,
  notifyBountyRejected,
} from "../lib/notifications.js";

export const BountyCreateSchema = z.object({
  title: z.string().max(200).describe("Title of the bounty"),
  description: z.string().max(5000).describe("Detailed description"),
  tenant_id: z.string().optional().describe("Tenant ID for multi-tenant isolation"),
  instructions: z.string().optional().describe("Step-by-step instructions for the human"),
  category_id: z.string().optional().describe("Category UUID"),
  template_id: z.string().optional().describe("Template UUID"),
  location_address: z.string().optional().describe("Street address"),
  location_lat: z.number().optional().describe("Latitude"),
  location_lng: z.number().optional().describe("Longitude"),
  reward_amount: z.number().optional().default(0).describe("Reward amount in USD"),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD"),
  deadline: z.string().optional().describe("ISO 8601 deadline"),
});

export const BountyListSchema = z.object({
  status: z.enum(["open", "accepted", "in_progress", "submitted", "reviewing", "completed", "disputed", "cancelled", "refunded"]).optional().describe("Filter by status"),
  category_id: z.string().optional().describe("Filter by category UUID"),
  assigned_human_id: z.string().optional().describe("Filter by assigned human"),
  limit: z.number().optional().default(20).describe("Number of results"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

export const BountyGetSchema = z.object({
  id: z.string().describe("ID of the bounty"),
});

export const BountyAcceptSchema = z.object({
  id: z.string().describe("ID of the bounty to accept"),
  assigned_human_id: z.string().describe("ID of the human accepting"),
});

export const BountySubmitSchema = z.object({
  id: z.string().describe("ID of the bounty to submit"),
  content: z.string().max(5000).optional().describe("Submission notes/description"),
  media_urls: z.array(z.string()).optional().default([]).describe("Array of photo/video URL strings"),
});

export const BountyReviewSchema = z.object({
  id: z.string().describe("ID of the bounty to review"),
  decision: z.enum(["approved", "rejected"]).describe("Review decision"),
  notes: z.string().max(5000).optional().describe("Review notes"),
});

export async function handleCreateBounty(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bounties")
    .insert({
      tenant_id: tenantId,
      title: sanitizeInput(args.title, 200),
      description: sanitizeInput(args.description, 5000),
      instructions: args.instructions ? sanitizeInput(args.instructions, 5000) : null,
      category_id: args.category_id ?? null,
      template_id: args.template_id ?? null,
      location_address: args.location_address ?? null,
      location_lat: args.location_lat ?? null,
      location_lng: args.location_lng ?? null,
      reward_amount: args.reward_amount ?? 0,
      currency: args.currency ?? "USD",
      deadline: args.deadline ?? null,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  // Notify matching workers asynchronously (don't block response)
  notifyBountyCreated(data).catch((err) => {
    console.warn("[bounties:create] Notification error:", err.message);
  });

  // Broadcast SSE event
  sseEmitter.broadcast("bounty.created", tenantId, { bounty_id: data.id, title: data.title, status: data.status, reward_amount: data.reward_amount });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ bounty: data, message: "Bounty created successfully" }, null, 2),
      },
    ],
  };
}

export async function handleListBounties(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("bounties")
    .select("id, tenant_id, category_id, title, description, instructions, location_address, reward_amount, currency, status, deadline, created_at", { count: "exact" })
    .eq("tenant_id", tenantId);

  if (args.status) {
    query = query.eq("status", args.status);
  }

  if (args.category_id) {
    query = query.eq("category_id", args.category_id);
  }

  if (args.assigned_human_id) {
    query = query.eq("assigned_human_id", args.assigned_human_id);
  }

  query = query
    .order("created_at", { ascending: false })
    .range(args.offset ?? 0, (args.offset ?? 0) + (args.limit ?? 20) - 1);

  const { data, error, count } = await query;

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ bounties: data ?? [], total: count ?? 0 }, null, 2),
      },
    ],
  };
}

export async function handleGetBounty(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("bounties")
    .select("id, tenant_id, category_id, template_id, assigned_human_id, title, description, instructions, location_address, location_lat, location_lng, reward_amount, currency, status, deadline, metadata, created_at, updated_at")
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export async function handleAcceptBounty(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: fetchError } = await supabase
    .from("bounties")
    .select("status")
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !bounty) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }] };
  }

  if (bounty.status !== "open") {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: `Bounty cannot be accepted. Current status: ${bounty.status}` }),
        },
      ],
    };
  }

  const { data, error } = await supabase
    .from("bounties")
    .update({ status: "accepted", assigned_human_id: args.assigned_human_id })
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  // Create bounty_assignments record
  await supabase.from("bounty_assignments").insert({
    bounty_id: args.id,
    human_id: args.assigned_human_id,
    status: "accepted",
  });

  // Notify tenant/agent asynchronously
  notifyBountyAccepted(data, args.assigned_human_id).catch((err) => {
    console.warn("[bounties:accept] Notification error:", err.message);
  });

  // Broadcast SSE event
  sseEmitter.broadcast("bounty.accepted", tenantId, { bounty_id: data.id, assigned_human_id: args.assigned_human_id, status: data.status });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ bounty: data, message: "Bounty accepted successfully" }, null, 2),
      },
    ],
  };
}

export async function handleSubmitBounty(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  // Get the bounty to find assigned human
  const { data: bounty, error: fetchError } = await supabase
    .from("bounties")
    .select("assigned_human_id")
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .single();

  if (fetchError || !bounty) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }] };
  }

  if (!bounty.assigned_human_id) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty has no assigned human" }) }] };
  }

  // Validate media_urls if provided
  const mediaUrls = args.media_urls ?? [];
  if (mediaUrls.length > 0) {
    const invalidUrls = mediaUrls.filter((url: string) => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });
    if (invalidUrls.length > 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({ error: `Invalid media URLs: ${invalidUrls.join(", ")}` }),
          },
        ],
      };
    }
  }

  // Create submission record
  const { data: submission, error: submissionError } = await supabase
    .from("task_submissions")
    .insert({
      bounty_id: args.id,
      human_id: bounty.assigned_human_id,
      content: args.content ? sanitizeInput(args.content, 5000) : null,
      media_urls: mediaUrls,
      status: "submitted",
    })
    .select()
    .single();

  if (submissionError) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: submissionError.message }) }] };
  }

  // Update bounty status
  const { data: updatedBounty, error: bountyError } = await supabase
    .from("bounties")
    .update({ status: "submitted" })
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (bountyError) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: bountyError.message }) }] };
  }

  // Notify tenant/agent asynchronously
  notifyBountySubmitted(updatedBounty, submission).catch((err) => {
    console.warn("[bounties:submit] Notification error:", err.message);
  });

  // Broadcast SSE event
  sseEmitter.broadcast("bounty.submitted", tenantId, { bounty_id: updatedBounty.id, status: updatedBounty.status });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ submission, bounty: updatedBounty, message: "Bounty submitted for review" }, null, 2),
      },
    ],
  };
}

export async function handleReviewBounty(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  // Verify bounty belongs to tenant
  const { data: bountyCheck, error: tenantCheckError } = await supabase
    .from("bounties")
    .select("id")
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .single();

  if (tenantCheckError || !bountyCheck) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }] };
  }

  // Find the latest submission for this bounty
  const { data: submission, error: subError } = await supabase
    .from("task_submissions")
    .select("id")
    .eq("bounty_id", args.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (subError || !submission) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: "No submission found for this bounty" }) }] };
  }

  // Update submission with review decision
  const { error: reviewError } = await supabase
    .from("task_submissions")
    .update({
      status: args.decision,
      reviewer_notes: args.notes ? sanitizeInput(args.notes, 5000) : null,
    })
    .eq("id", submission.id);

  if (reviewError) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: reviewError.message }) }] };
  }

  // Update bounty status
  const newStatus = args.decision === "approved" ? "completed" : "revision_requested";

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .update({ status: newStatus })
    .eq("id", args.id)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (bountyError) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: bountyError.message }) }] };
  }

  // Notify worker asynchronously
  if (bounty.assigned_human_id) {
    if (args.decision === "approved") {
      notifyBountyApproved(bounty, bounty.assigned_human_id).catch((err) => {
        console.warn("[bounties:review] Notification error:", err.message);
      });
    } else {
      notifyBountyRejected(bounty, bounty.assigned_human_id, args.notes).catch((err) => {
        console.warn("[bounties:review] Notification error:", err.message);
      });
    }
  }

  // Broadcast SSE event
  const eventType = args.decision === "approved" ? "bounty.approved" : "bounty.rejected";
  sseEmitter.broadcast(eventType, tenantId, { bounty_id: bounty.id, decision: args.decision, status: bounty.status });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ bounty, review_decision: args.decision, message: `Bounty ${args.decision}` }, null, 2),
      },
    ],
  };
}

export function registerBountyTools(server: McpServer) {
  // ── create_bounty ───────────────────────────────────────────────────────────
  server.tool(
    "create_bounty",
    "Create a new bounty task for human workers to accept",
    BountyCreateSchema.shape,
    async (args) => handleCreateBounty(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── list_bounties ───────────────────────────────────────────────────────────
  server.tool(
    "list_bounties",
    "List bounties with optional status and category filters",
    BountyListSchema.shape,
    async (args) => handleListBounties(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── get_bounty ──────────────────────────────────────────────────────────────
  server.tool(
    "get_bounty",
    "Get a single bounty with details",
    BountyGetSchema.shape,
    async (args) => handleGetBounty(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── accept_bounty ───────────────────────────────────────────────────────────
  server.tool(
    "accept_bounty",
    "Accept a bounty and assign it to a human worker",
    BountyAcceptSchema.shape,
    async (args) => handleAcceptBounty(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── submit_bounty ──────────────────────────────────────────────────────────
  server.tool(
    "submit_bounty",
    "Submit a completed bounty with evidence (photos/notes)",
    BountySubmitSchema.shape,
    async (args) => handleSubmitBounty(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── review_bounty ─────────────────────────────────────────────────────────
  server.tool(
    "review_bounty",
    "Approve or reject a submitted bounty",
    BountyReviewSchema.shape,
    async (args) => handleReviewBounty(args, process.env.DEFAULT_TENANT_ID || "")
  );
}
