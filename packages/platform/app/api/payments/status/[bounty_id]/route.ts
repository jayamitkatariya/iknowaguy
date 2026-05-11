import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: { bounty_id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("payment_transactions")
    .select("*")
    .eq("bounty_id", params.bounty_id)
    .eq("tenant_id", auth.tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return Response.json({ data: null });
  return Response.json({ data });
}
