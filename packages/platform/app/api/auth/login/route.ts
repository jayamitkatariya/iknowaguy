import bcrypt from "bcryptjs";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return Response.json({ error: "Email and password are required" }, { status: 400 });

    const { data: user, error: userError } = await getSupabaseAdmin()
      .from("users")
      .select("id, tenant_id, email, password_hash, role, is_active, tenants:tenant_id(id, name, slug)")
      .eq("email", email.toLowerCase())
      .single();

    if (userError || !user) return Response.json({ error: "Invalid credentials" }, { status: 401 });
    if (!user.is_active) return Response.json({ error: "Account is deactivated" }, { status: 403 });
    if (!user.password_hash) return Response.json({ error: "Invalid credentials" }, { status: 401 });
    if (!await bcrypt.compare(password, user.password_hash)) return Response.json({ error: "Invalid credentials" }, { status: 401 });

    const apiKey = generateApiKey();
    await getSupabaseAdmin()
      .from("tenants")
      .update({ api_key_hash: hashApiKey(apiKey) })
      .eq("id", user.tenant_id);

    const res = Response.json({
      data: {
        tenant: user.tenants,
        user: { id: user.id, email: user.email, role: user.role },
        api_key: apiKey,
      },
    });
    res.headers.set("Set-Cookie", `ikg_token=${encodeURIComponent(apiKey)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}`);
    return res;
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
