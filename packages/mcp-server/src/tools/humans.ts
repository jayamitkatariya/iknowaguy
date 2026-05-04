import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { notifyBountyCreated, notificationManager } from "../lib/notifications.js";

function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

const HumanListSchema = z.object({
  skills: z.array(z.string()).optional().describe("Filter by skills (array overlap)"),
  location_city: z.string().optional().describe("Filter by city"),
  location_country: z.string().optional().describe("Filter by country"),
  verification_status: z.string().optional().default("verified").describe("Filter by verification status"),
  limit: z.number().optional().default(20).describe("Number of results"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

const HumanGetSchema = z.object({
  human_id: z.string().describe("ID of the human worker (human_profiles.id)"),
});

const HumanRequestSchema = z.object({
  title: z.string().describe("Title of the task request"),
  description: z.string().describe("Description of the task"),
  instructions: z.string().optional().describe("Step-by-step instructions for the human"),
  target_human_id: z.string().optional().describe("Specific human to request"),
  skills: z.array(z.string()).optional().describe("Required skills (used only if target_human_id not provided)"),
  location_address: z.string().optional().describe("Task location address"),
  location_lat: z.number().optional().describe("Task latitude"),
  location_lng: z.number().optional().describe("Task longitude"),
  reward_amount: z.number().optional().default(0).describe("Reward amount in USD"),
  deadline: z.string().optional().describe("ISO 8601 deadline"),
});

export async function handleListHumans(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  let query = supabase
    .from("human_profiles")
    .select("id, full_name, avatar_url, bio, skills, languages, location_city, location_country, verification_status, rating, completed_tasks, hourly_rate, created_at")
    .eq("verification_status", args.verification_status ?? "verified");

  if (args.skills && args.skills.length > 0) {
    query = query.contains("skills", args.skills);
  }

  if (args.location_city) {
    query = query.ilike("location_city", args.location_city);
  }

  if (args.location_country) {
    query = query.ilike("location_country", args.location_country);
  }

  query = query.range(args.offset ?? 0, (args.offset ?? 0) + (args.limit ?? 20) - 1);

  const { data, error } = await query;

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  return {
    content: [{ type: "text" as const, text: JSON.stringify({ humans: data ?? [], total: (data ?? []).length }, null, 2) }],
  };
}

export async function handleGetHuman(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  // human_profiles.id IS the user id — no join needed
  const { data, error } = await supabase
    .from("human_profiles")
    .select("id, full_name, avatar_url, bio, skills, languages, location_city, location_country, verification_status, rating, completed_tasks, hourly_rate, created_at, updated_at")
    .eq("id", args.human_id)
    .single();

  if (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }] };
  }

  // Also fetch the user's email from users table
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", args.human_id)
    .single();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ ...data, email: userData?.email ?? null }, null, 2),
      },
    ],
  };
}

export async function handleRequestHuman(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();
  let targetHumanId = args.target_human_id;

  // Auto-select if not specified
  if (!targetHumanId) {
    let query = supabase
      .from("human_profiles")
      .select("id")
      .eq("verification_status", "verified");

    if (args.skills && args.skills.length > 0) {
      query = query.contains("skills", args.skills);
    }

    const { data: candidates, error: candidateError } = await query.limit(1);

    if (candidateError || !candidates || candidates.length === 0) {
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ error: "No verified humans match the criteria" }) }],
      };
    }

    targetHumanId = candidates[0].id;
  }

  // Get tenant_id from the target human's user record
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id, email")
    .eq("id", targetHumanId)
    .single();

  if (userError || !userData) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Target human user record not found" }) }],
    };
  }

  // Create bounty assigned to this human
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .insert({
      tenant_id: userData.tenant_id,
      title: args.title,
      description: args.description,
      instructions: args.instructions ?? null,
      assigned_human_id: targetHumanId,
      location_address: args.location_address ?? null,
      location_lat: args.location_lat ?? null,
      location_lng: args.location_lng ?? null,
      reward_amount: args.reward_amount ?? 0,
      currency: "USD",
      deadline: args.deadline ?? null,
      status: "open",
    })
    .select()
    .single();

  if (bountyError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: bountyError.message }) }],
    };
  }

  // Send notification to the assigned human
  const notifications: { channel: string; status: string }[] = [];

  if (userData.email) {
    const result = await notificationManager.send("email", { email: userData.email }, {
      title: `New Task: ${args.title}`,
      body: `You have a new task assignment:\n\n${args.title}\n${args.description}\n\nReward: $${args.reward_amount || 0} USD`,
      bountyId: bounty.id,
      urgency: "medium",
    });
    notifications.push({ channel: "email", status: result.success ? "sent" : result.error || "failed" });
  } else {
    notifications.push({ channel: "email", status: "no_email" });
  }

  // Also trigger matching-worker style notification via the lifecycle helper
  notifyBountyCreated(bounty).catch((err) => {
    console.warn("[humans:request] Notification error:", err.message);
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ bounty, notifications, message: `Task created and assigned` }, null, 2),
      },
    ],
  };
}

export function registerHumanTools(server: McpServer) {
  // ── list_humans ──────────────────────────────────────────────────────────────
  server.tool(
    "list_humans",
    "List available human workers with optional filters for skills, location, and verification status",
    HumanListSchema.shape,
    async (args) => handleListHumans(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── get_human ────────────────────────────────────────────────────────────────
  server.tool(
    "get_human",
    "Get full profile details for a specific human worker by ID",
    HumanGetSchema.shape,
    async (args) => handleGetHuman(args, process.env.DEFAULT_TENANT_ID || "")
  );

  // ── request_human ───────────────────────────────────────────────────────────
  server.tool(
    "request_human",
    "Create an internal task bounty assigned to a specific human (or auto-select by skills) and notify them",
    HumanRequestSchema.shape,
    async (args) => handleRequestHuman(args, process.env.DEFAULT_TENANT_ID || "")
  );
}
