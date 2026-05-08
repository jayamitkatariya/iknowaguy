import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { getSupabaseClient } from "./lib/supabase.js";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(key: string): Promise<{ id: string; name: string; slug: string } | null> {
  const supabase = getSupabaseClient();
  const hashedKey = hashApiKey(key);

  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug, api_key_prefix")
    .eq("api_key_hash", hashedKey)
    .single();

  if (error || !data) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("api_key", key)
      .single();

    if (fallbackError || !fallbackData) {
      console.log(`[auth] API key validation failed: ${error?.message || "not found"}`);
      return null;
    }

    return {
      id: fallbackData.id,
      name: fallbackData.name,
      slug: fallbackData.slug,
    };
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

export async function setTenantContext(supabaseClient: ReturnType<typeof getSupabaseClient>, tenantId: string): Promise<void> {
  await supabaseClient.rpc("set_config", {
    setting: "app.current_tenant_id",
    value: tenantId,
    is_local: true,
  });
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
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

    req.tenant = tenant;

    const supabase = getSupabaseClient();
    await setTenantContext(supabase, tenant.id);

    next();
  } catch (error: any) {
    console.error("[auth] Middleware error:", error.message);
    return res.status(500).json({ error: "Internal authentication error" });
  }
}