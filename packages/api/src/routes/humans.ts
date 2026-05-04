import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const humans = new Hono<Env>();

humans.get('/humans', async (c) => {
  const tenantId = c.get('tenantId');

  const { data, error } = await supabase
    .from('human_profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      location_city,
      location_country,
      bio,
      skills,
      languages,
      verification_status,
      rating,
      completed_tasks,
      hourly_rate,
      created_at
    `)
    .eq('users.tenant_id', tenantId)
    .eq('users.is_active', true)
    .order('rating', { ascending: false });

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

humans.get('/humans/:id', async (c) => {
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('human_profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      location_city,
      location_country,
      bio,
      skills,
      languages,
      verification_status,
      rating,
      completed_tasks,
      hourly_rate,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single();

  if (error) {
    return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
  }

  return c.json({ data });
});

export default humans;
