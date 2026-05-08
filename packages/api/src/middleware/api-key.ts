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

export const apiKeyMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.slice(7);
  const hashedKey = hashApiKey(apiKey);

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
  c.set('apiKey', apiKey);

  await next();
};
