import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: { bounty_id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("messages")
    .select("*")
    .eq("bounty_id", params.bounty_id)
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
