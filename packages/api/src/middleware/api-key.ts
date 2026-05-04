import type { MiddlewareHandler } from 'hono';
import { supabase } from '../lib/supabase.js';

export interface Env {
  Variables: {
    tenantId: string;
    apiKey: string;
  };
}

export const apiKeyMiddleware: MiddlewareHandler<Env> = async (c, next): Promise<void> => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    c.status(401);
    c.json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const apiKey = authHeader.slice(7);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, settings')
    .eq('api_key', apiKey)
    .single();

  if (error || !tenant) {
    c.status(401);
    c.json({ error: 'Invalid API key' });
    return;
  }

  c.set('tenantId', tenant.id);
  c.set('apiKey', apiKey);

  await next();
};
