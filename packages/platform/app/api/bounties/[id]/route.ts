import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

const ALLOWED_UPDATE_FIELDS = [
  "title", "description", "instructions", "category_id",
  "location_address", "location_lat", "location_lng",
  "reward_amount", "currency", "deadline"
];

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data: bounty, error } = await getSupabaseAdmin()
    .from("bounties")
    .select("*, category:categories(name, slug, icon), submissions:task_submissions(id, status, created_at, content, media_urls)")
    .eq("id", params.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  if (!bounty) return Response.json({ error: "Bounty not found" }, { status: 404 });

  return Response.json({ data: bounty });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json();
  const filtered: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const field of ALLOWED_UPDATE_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }

  const { data, error } = await getSupabaseAdmin()
    .from("bounties")
    .update(filtered)
    .eq("id", params.id)
    .eq("tenant_id", auth.tenantId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Bounty not found" }, { status: 404 });
  return Response.json({ data });
}
