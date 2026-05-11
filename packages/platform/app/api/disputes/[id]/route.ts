import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("disputes")
    .select("*, bounty:bounty_id(id, title, status)")
    .eq("id", params.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
