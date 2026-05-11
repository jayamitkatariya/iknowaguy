import { getSupabaseAdmin } from "./supabase/admin";
import { hashApiKey } from "./utils";

export async function verifyApiKey(authHeader: string | null): Promise<{ tenantId: string; tenantSlug: string } | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  if (token.startsWith("eyJ")) {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (!error && data.user) {
      return { tenantId: data.user.id, tenantSlug: "supabase-auth" };
    }
  }

  const hashedKey = hashApiKey(token);
  const { data: tenant, error } = await getSupabaseAdmin()
    .from("tenants")
    .select("id, slug")
    .eq("api_key_hash", hashedKey)
    .single();

  if (error || !tenant) return null;

  return { tenantId: tenant.id, tenantSlug: tenant.slug };
}

export function requireAuth(handler: (req: Request, ctx: { tenantId: string; tenantSlug: string }) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const auth = await verifyApiKey(req.headers.get("Authorization"));
    if (!auth) {
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }
    return handler(req, auth);
  };
}
