import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

const ALLOWED_BOUNTY_FIELDS = [
  "title", "description", "instructions", "category_id",
  "location_address", "location_lat", "location_lng",
  "reward_amount", "currency", "deadline"
];

export async function GET(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category_id = searchParams.get("category_id");
  const scope = searchParams.get("scope");
  const assigned_human_id = searchParams.get("assigned_human_id");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = (page - 1) * limit;

  let query = getSupabaseAdmin()
    .from("bounties")
    .select("*, category:categories(name, slug, icon)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (scope === "all") {
    if (status) query = query.eq("status", status);
    else query = query.eq("status", "open");
  } else if (assigned_human_id) {
    if (status) query = query.eq("status", status);
  } else {
    query = query.eq("tenant_id", auth.tenantId);
    if (status) query = query.eq("status", status);
  }

  if (assigned_human_id) query = query.eq("assigned_human_id", assigned_human_id);
  if (category_id) query = query.eq("category_id", category_id);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  let countQuery = getSupabaseAdmin().from("bounties").select("*", { count: "exact", head: true });
  if (scope === "all") {
    if (status) countQuery = countQuery.eq("status", status);
    else countQuery = countQuery.eq("status", "open");
  } else if (assigned_human_id) {
    if (status) countQuery = countQuery.eq("status", status);
  } else {
    countQuery = countQuery.eq("tenant_id", auth.tenantId);
    if (status) countQuery = countQuery.eq("status", status);
  }
  if (assigned_human_id) countQuery = countQuery.eq("assigned_human_id", assigned_human_id);
  if (category_id) countQuery = countQuery.eq("category_id", category_id);
  const { count } = await countQuery;

  return Response.json({ data, meta: { page, limit, total: count ?? 0 } });
}

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json();
  const filtered: Record<string, any> = { tenant_id: auth.tenantId, status: "open" };
  for (const field of ALLOWED_BOUNTY_FIELDS) {
    if (body[field] !== undefined) filtered[field] = body[field];
  }

  const { data, error } = await getSupabaseAdmin()
    .from("bounties")
    .insert(filtered)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data }, { status: 201 });
}
