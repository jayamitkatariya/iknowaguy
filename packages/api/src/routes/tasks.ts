import { Hono } from 'hono';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const tasks = new Hono<Env>();

tasks.get('/tasks/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  let bounty;
  try {
    const result = await supabase
      .from('bounties')
      .select(`
        *,
        category:categories(name, slug, icon)
      `)
      .eq('id', bountyId)
      .eq('tenant_id', tenantId)
      .single();
    
    if (result.error) {
      return c.json({ error: result.error.message || 'Bounty not found' }, 404);
    }
    bounty = result.data;
  } catch (err: any) {
    return c.json({ error: err?.message || 'Failed to fetch bounty' }, 500);
  }

  if (!bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
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
      human:users(id, email, role)
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
