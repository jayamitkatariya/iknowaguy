import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey, sanitizeInput } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, slug, email, password, role } = body;
    const userRole = role || "admin";

    if (!name || !slug || !email || !password) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return Response.json({ error: "Invalid slug format" }, { status: 400 });
    }
    if (password.length < 8) {
      return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const { data: existingTenant } = await getSupabaseAdmin().from("tenants").select("id").eq("slug", slug).single();
    if (existingTenant) return Response.json({ error: "Slug is already taken" }, { status: 409 });

    const { data: existingUser } = await getSupabaseAdmin().from("users").select("id").eq("email", email.toLowerCase()).single();
    if (existingUser) return Response.json({ error: "Email is already registered" }, { status: 409 });

    const rawApiKey = generateApiKey();
    const hashedApiKey = hashApiKey(rawApiKey);

    const { data: tenant, error: tenantError } = await getSupabaseAdmin()
      .from("tenants")
      .insert({ name: sanitizeInput(name, 200), slug, api_key_hash: hashedApiKey, settings: { plan: "free", rate_limit: 100 } })
      .select("id, name, slug, created_at")
      .single();

    if (tenantError || !tenant) return Response.json({ error: "Failed to create tenant" }, { status: 500 });

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: user, error: userError } = await getSupabaseAdmin()
      .from("users")
      .insert({ tenant_id: tenant.id, email: email.toLowerCase(), password_hash: passwordHash, role: userRole, is_active: true })
      .select("id, email, role")
      .single();

    if (userError || !user) {
      await getSupabaseAdmin().from("tenants").delete().eq("id", tenant.id);
      return Response.json({ error: "Failed to create user" }, { status: 500 });
    }

    const res = Response.json({ data: { tenant, user, api_key: rawApiKey } }, { status: 201 });
    res.headers.set("Set-Cookie", `ikg_token=${encodeURIComponent(rawApiKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    return res;
  } catch (err: any) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
