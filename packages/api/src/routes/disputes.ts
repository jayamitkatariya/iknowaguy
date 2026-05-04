import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const disputes = new Hono<Env>();

const createDisputeSchema = z.object({
  bounty_id: z.string().uuid(),
  reason: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

disputes.post('/disputes', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = createDisputeSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const bountyCheck = await supabase
    .from('bounties')
    .select('id')
    .eq('id', parsed.data.bounty_id)
    .eq('tenant_id', tenantId)
    .single();

  if (!bountyCheck.data) {
    return c.json({ error: 'Bounty not found or not accessible' }, 404);
  }

  const { data, error } = await supabase
    .from('disputes')
    .insert({
      bounty_id: parsed.data.bounty_id,
      raised_by: tenantId,
      reason: parsed.data.reason,
      description: parsed.data.description,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  await supabase
    .from('bounties')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.bounty_id);

  return c.json({ data }, 201);
});

disputes.get('/disputes/:id', async (c) => {
  const id = c.req.param('id');

  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      bounty:bounties(title, status, reward_amount),
      raised_by_user:users(email, role)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
  }

  return c.json({ data });
});

export default disputes;
