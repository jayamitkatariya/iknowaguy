import type { MiddlewareHandler } from 'hono';
import { supabase } from '../lib/supabase.js';

export interface Env {
  Variables: {
    tenantId: string;
    apiKey: string;
  };
}

export const apiKeyMiddleware: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.slice(7);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, settings')
    .eq('api_key', apiKey)
    .single();

  if (error || !tenant) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  c.set('tenantId', tenant.id);
  c.set('apiKey', apiKey);

  await next();
};
