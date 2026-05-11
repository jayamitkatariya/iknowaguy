import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const { data, error } = await getSupabaseAdmin().from("categories").select("id, name, description, icon").order("name");
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
