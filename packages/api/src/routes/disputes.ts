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

  // Look up the first user in this tenant
  const { data: raiserUser } = await supabase
    .from('users')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .single();

  if (!raiserUser) {
    return c.json({ error: 'No user found for tenant' }, 400);
  }

  const { data, error } = await supabase
    .from('disputes')
    .insert({
      bounty_id: parsed.data.bounty_id,
      raised_by: raiserUser.id,
      reason: parsed.data.reason,
      description: parsed.data.description,
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  const { error: updateError } = await supabase
    .from('bounties')
    .update({ status: 'disputed', updated_at: new Date().toISOString() })
    .eq('id', parsed.data.bounty_id)
    .eq('tenant_id', tenantId);

  if (updateError) {
    console.error('[disputes:create] Failed to update bounty status:', updateError);
  }

  return c.json({ data }, 201);
});

disputes.get('/disputes/:id', async (c) => {
  const tenantId = c.get('tenantId');
  const id = c.req.param('id');

  // Find dispute and verify tenant ownership via bounty
  const { data: dispute, error } = await supabase
    .from('disputes')
    .select(`
      *,
      bounty:bounties(id, title, status, reward_amount, tenant_id),
      raised_by_user:users(id, email, role)
    `)
    .eq('id', id)
    .single();

  if (error || !dispute) {
    return c.json({ error: 'Dispute not found' }, 404);
  }

  // Tenant isolation: check bounty belongs to this tenant
  if (dispute.bounty?.tenant_id !== tenantId) {
    return c.json({ error: 'Dispute not found' }, 404);
  }

  return c.json({ data: dispute });
});

export default disputes;
