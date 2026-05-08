import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const humans = new Hono<Env>();

humans.get('/humans', async (c) => {
  // human_profiles is not tenant-scoped — it's a global pool of worker profiles
  // We filter by tenantId only for rows that reference a tenant-scoped user
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
    .eq('is_available', true)
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
