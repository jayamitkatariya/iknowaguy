import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { content, media_urls } = await req.json();

  const { data: bounty } = await getSupabaseAdmin()
    .from("bounties")
    .select("id, assigned_human_id, tenant_id, status")
    .eq("id", params.id)
    .single();

  if (!bounty) return Response.json({ error: "Bounty not found" }, { status: 404 });
  if (!bounty.assigned_human_id) return Response.json({ error: "Bounty has no assigned human" }, { status: 400 });
  if (bounty.status !== "accepted" && bounty.status !== "in_progress") {
    return Response.json({ error: "Bounty is not in progress" }, { status: 409 });
  }

  const { data: submission, error: subError } = await getSupabaseAdmin()
    .from("task_submissions")
    .insert({ bounty_id: params.id, human_id: bounty.assigned_human_id, content, media_urls: media_urls || [] })
    .select()
    .single();

  if (subError) return Response.json({ error: subError.message }, { status: 500 });

  const { data, error } = await getSupabaseAdmin()
    .from("bounties")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data, submission });
}
