import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "./lib/supabase.js";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(key: string): Promise<{ id: string; name: string; slug: string } | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, api_key")
    .eq("api_key", key)
    .single();

  if (error || !data) {
    console.log(`[auth] API key validation failed: ${error?.message || "not found"}`);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
  };
}

export function extractApiKey(authHeader: string): string | null {
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 8) + "****";
}

export async function setTenantContext(supabaseClient: ReturnType<typeof getSupabaseClient>, tenantId: string): Promise<void> {
  await supabaseClient.rpc("set_config", {
    setting: "app.current_tenant_id",
    value: tenantId,
    is_local: true,
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const key = extractApiKey(authHeader);
  if (!key) {
    return res.status(401).json({ error: "Invalid Authorization header format" });
  }

  const tenant = await validateApiKey(key);

  if (!tenant) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  (req as any).tenant = tenant;

  const supabase = getSupabaseClient();
  await setTenantContext(supabase, tenant.id);

  next();
}