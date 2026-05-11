import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";
import { sanitizeInput } from "@/lib/utils";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { bounty_id, reason, description, evidence_urls } = await req.json();
  if (!bounty_id || !reason) return Response.json({ error: "bounty_id and reason are required" }, { status: 400 });

  const { data: dispute, error: disputeError } = await getSupabaseAdmin()
    .from("disputes")
    .insert({ bounty_id, raised_by: auth.tenantId, reason: sanitizeInput(reason, 200), description: description ? sanitizeInput(description) : null, evidence_urls: evidence_urls || [], status: "open" })
    .select()
    .single();

  if (disputeError) return Response.json({ error: disputeError.message }, { status: 500 });

  await getSupabaseAdmin().from("bounties").update({ status: "disputed" }).eq("id", bounty_id).eq("tenant_id", auth.tenantId);

  return Response.json({ data: dispute }, { status: 201 });
}
