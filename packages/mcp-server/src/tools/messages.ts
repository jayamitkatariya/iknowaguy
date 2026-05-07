import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";

export const MessageSendSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty thread"),
  sender_id: z.string().describe("ID of the message sender"),
  content: z.string().max(2000).describe("Message content"),
});

export const MessageListSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty thread"),
  limit: z.number().optional().default(50).describe("Number of results"),
  offset: z.number().optional().default(0).describe("Offset for pagination"),
});

export async function handleSendMessage(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      bounty_id: args.bounty_id,
      sender_id: args.sender_id,
      content: args.content,
    })
    .select()
    .single();

  if (error) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ message_id: data.id, created_at: data.created_at }, null, 2),
      },
    ],
  };
}

export async function handleListMessages(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("messages")
    .select(`
      *,
      sender:users!sender_id (
        id,
        name,
        avatar_url
      )
    `)
    .eq("bounty_id", args.bounty_id)
    .order("created_at", { ascending: true })
    .range(args.offset ?? 0, (args.offset ?? 0) + (args.limit ?? 50) - 1);

  if (error) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: error.message }) }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ messages: data, total: data?.length ?? 0 }, null, 2),
      },
    ],
  };
}

export function registerMessageTools(server: McpServer) {
  server.tool(
    "send_message",
    "Send a message in a bounty thread",
    MessageSendSchema.shape,
    async (args) => handleSendMessage(args, process.env.DEFAULT_TENANT_ID || "")
  );

  server.tool(
    "list_messages",
    "List messages for a bounty thread ordered by creation time",
    MessageListSchema.shape,
    async (args) => handleListMessages(args, process.env.DEFAULT_TENANT_ID || "")
  );
}
