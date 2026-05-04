import { getSupabaseClient } from "../lib/supabase.js";

export type RoutingMode = "internal" | "external" | "auto";

export async function resolveRoutingMode(tenantId: string): Promise<RoutingMode> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .single();

  if (error || !data) {
    return "external";
  }

  const { count: userCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("user_type", "human")
    .eq("is_active", true);

  if (!userCount) {
    return "external";
  }

  return "auto";
}

export async function shouldRouteExternally(
  tenantId: string,
  options?: {
    requiredSkills?: string[];
    locationCity?: string;
    locationCountry?: string;
    urgency?: string;
  }
): Promise<boolean> {
  const mode = await resolveRoutingMode(tenantId);

  if (mode === "external") {
    return true;
  }

  if (mode === "internal") {
    return false;
  }

  const supabase = getSupabaseClient();

  let query = supabase
    .from("human_profiles")
    .select("id", { count: "exact", head: true })
    .eq("users.tenant_id", tenantId)
    .eq("human_profiles.is_available", true)
    .eq("users.is_active", true);

  if (options?.requiredSkills && options.requiredSkills.length > 0) {
    query = query.contains("skills", options.requiredSkills);
  }

  if (options?.locationCity) {
    query = query.eq("location_city", options.locationCity);
  }

  if (options?.locationCountry) {
    query = query.eq("location_country", options.locationCountry);
  }

  const { count, error } = await query;

  if (error) {
    return true;
  }

  if (count === 0) {
    return true;
  }

  if (options?.urgency === "high" && count < 2) {
    return true;
  }

  return false;
}
