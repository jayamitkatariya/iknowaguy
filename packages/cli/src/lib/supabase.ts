/**
 * Supabase client for tenant registration
 */
import { createClient } from '@supabase/supabase-js';

export async function registerTenant(name: string, slug: string): Promise<{
  api_key: string;
  tenant_id: string;
  supabase_url: string;
  supabase_service_role_key: string;
} | null> {
  // For now, return mock data - in production this would call the registration API
  const apiKey = `hah_${Math.random().toString(36).substring(2, 28)}`;
  
  // Try to create tenant in Supabase if configured
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase
        .from('tenants')
        .insert({ name, slug, api_key: apiKey })
        .select()
        .single();
      
      if (!error && data) {
        return {
          api_key: apiKey,
          tenant_id: data.id,
          supabase_url: supabaseUrl,
          supabase_service_role_key: supabaseKey,
        };
      }
    }
  } catch {
    // Continue with mock data
  }
  
  // Mock response for development
  return {
    api_key: apiKey,
    tenant_id: `tenant_${Math.random().toString(36).substring(2, 12)}`,
    supabase_url: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
    supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY || 'mock-key',
  };
}