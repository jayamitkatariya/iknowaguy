import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data, error } = await getSupabaseAdmin()
    .from("human_profiles")
    .select("id, full_name, avatar_url, location_city, location_country, bio, skills, languages, verification_status, rating, completed_tasks, hourly_rate, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return Response.json({ data });
}
