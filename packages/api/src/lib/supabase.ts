import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const tenantClients: Map<string, SupabaseClient> = new Map();

export function getSupabase(tenantId?: string): SupabaseClient {
  if (!tenantId) {
    return supabase;
  }

  const cached = tenantClients.get(tenantId);
  if (cached) {
    return cached;
  }

  const client = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: { 'X-Tenant-ID': tenantId },
    },
  });

  tenantClients.set(tenantId, client);
  return client;
}