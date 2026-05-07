import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { notifyDisputeRaised } from "../lib/notifications.js";

export const DisputeRaiseSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty"),
  raised_by: z.string().describe("ID of the user raising the dispute"),
  reason: z.string().describe("Reason for the dispute"),
  evidence_urls: z.array(z.string()).optional().describe("Evidence URLs"),
});

export async function handleRaiseDispute(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, status, tenant_id, assigned_human_id, title")
    .eq("id", args.bounty_id)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  if (bounty.status === "disputed") {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty is already disputed" }) }],
    };
  }

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .insert({
      bounty_id: args.bounty_id,
      raised_by: args.raised_by,
      reason: args.reason,
      evidence_urls: args.evidence_urls ?? [],
      status: "open",
    })
    .select()
    .single();

  if (disputeError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: disputeError.message }) }],
    };
  }

  const { error: updateError } = await supabase
    .from("bounties")
    .update({
      status: "disputed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.bounty_id);

  if (updateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: updateError.message }) }],
    };
  }

  notifyDisputeRaised(dispute, bounty).catch((err) => {
    console.warn("[disputes:raise] Notification error:", err.message);
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            dispute,
            message: "Dispute raised successfully. Bounty status updated to disputed.",
          },
          null,
          2
        ),
      },
    ],
  };
}

export function registerDisputeTools(server: McpServer) {
  server.tool(
    "raise_dispute",
    "Raise a dispute on a bounty and update its status to disputed",
    DisputeRaiseSchema.shape,
    async (args) => handleRaiseDispute(args, process.env.DEFAULT_TENANT_ID || "")
  );
}
