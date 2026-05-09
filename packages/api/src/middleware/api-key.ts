import type { MiddlewareHandler } from 'hono';
import { createHash } from 'crypto';
import { supabase } from '../lib/supabase.js';

export interface Env {
  Variables: {
    tenantId: string;
    tenantSlug: string;
    apiKey: string;
  };
}

// Hash API key for storage comparison
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

// Verify Supabase Auth Bearer token and return the user
async function verifySupabaseAuthToken(token: string): Promise<{ id: string; email?: string } | null> {
  try {
    // Try to get user from the token using the auth endpoint
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export const apiKeyMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  // Check if this is a Supabase Auth token (JWT format - starts with eyJ)
  if (token.startsWith('eyJ')) {
    const authUser = await verifySupabaseAuthToken(token);
    if (authUser) {
      // Use the auth user id as tenant_id for Supabase Auth sessions
      c.set('tenantId', authUser.id);
      c.set('tenantSlug', 'supabase-auth');
      c.set('apiKey', token);
      await next();
      return;
    }
  }

  // Otherwise, treat as API key and look up tenant by hashed key
  const hashedKey = hashApiKey(token);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, settings')
    .eq('api_key_hash', hashedKey)
    .single();

  if (error || !tenant) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  c.set('tenantId', tenant.id);
  c.set('tenantSlug', tenant.slug);
  c.set('apiKey', token);

  await next();
};
