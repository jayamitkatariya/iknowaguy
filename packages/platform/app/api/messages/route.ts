import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { bounty_id, content } = await req.json();
  if (!bounty_id || !content) return Response.json({ error: "bounty_id and content are required" }, { status: 400 });

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .insert({ bounty_id, sender_id: auth.tenantId, content: sanitizeInput(content) })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}
