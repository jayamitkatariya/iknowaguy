import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { human_id } = await req.json();
  if (!human_id) return Response.json({ error: "human_id is required" }, { status: 400 });

  const { data: bounty } = await getSupabaseAdmin()
    .from("bounties")
    .select("id, status")
    .eq("id", params.id)
    .single();

  if (!bounty) return Response.json({ error: "Bounty not found" }, { status: 404 });
  if (bounty.status !== "open") return Response.json({ error: "Bounty is not available for acceptance" }, { status: 409 });

  const { data, error } = await getSupabaseAdmin()
    .from("bounties")
    .update({ assigned_human_id: human_id, status: "accepted", updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("status", "open")
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Bounty was already accepted" }, { status: 409 });

  return Response.json({ data });
}
