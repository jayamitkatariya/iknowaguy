import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const tasks = new Hono<Env>();

tasks.get('/tasks/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select(`
      *,
      category:categories(name, slug, icon),
      assigned_human:human_profiles(full_name, avatar_url, rating, bio)
    `)
    .eq('id', bountyId)
    .eq('tenant_id', tenantId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: bountyError?.message || 'Bounty not found' }, 404);
  }

  const { data: submissions, error: subError } = await supabase
    .from('task_submissions')
    .select(`
      id,
      content,
      media_urls,
      status,
      reviewer_notes,
      created_at,
      updated_at,
      human:human_profiles(full_name, avatar_url)
    `)
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: false });

  if (subError) {
    return c.json({ error: subError.message }, 500);
  }

  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select(`
      id,
      content,
      attachments,
      created_at,
      sender:users(email, role)
    `)
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: true });

  if (msgError) {
    return c.json({ error: msgError.message }, 500);
  }

  return c.json({
    data: {
      ...bounty,
      submissions: submissions || [],
      messages: messages || [],
    },
  });
});

export default tasks;
