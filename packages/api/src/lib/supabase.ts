import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function getSupabase(tenantId?: string) {
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    global: {
      headers: tenantId ? { 'X-Tenant-ID': tenantId } : {},
    },
  });
  return client;
}
