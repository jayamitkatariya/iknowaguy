import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const payments = new Hono<Env>();

const initiatePaymentSchema = z.object({
  bounty_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  method: z.enum(['stripe', 'escrow', 'direct']).optional(),
});

payments.post('/payments/initiate', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = initiatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, status, reward_amount, assigned_human_id')
    .eq('id', parsed.data.bounty_id)
    .eq('tenant_id', tenantId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (bounty.status !== 'completed') {
    return c.json({ error: 'Payment can only be initiated for completed bounties' }, 400);
  }

  const paymentIntent = {
    id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    bounty_id: parsed.data.bounty_id,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    status: 'pending',
    created_at: new Date().toISOString(),
  };

  return c.json({ data: paymentIntent }, 201);
});

payments.get('/payments/status/:bounty_id', async (c) => {
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error } = await supabase
    .from('bounties')
    .select('id, status, reward_amount, currency')
    .eq('id', bountyId)
    .single();

  if (error || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  const paymentStatus = bounty.status === 'completed' ? 'released' : 'pending';

  return c.json({
    data: {
      bounty_id: bountyId,
      amount: bounty.reward_amount,
      currency: bounty.currency,
      status: paymentStatus,
      bounty_status: bounty.status,
    },
  });
});

payments.post('/payments/release/:bounty_id', async (c) => {
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, status, reward_amount, assigned_human_id')
    .eq('id', bountyId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (bounty.status !== 'completed') {
    return c.json({ error: 'Bounty must be completed before releasing payment' }, 400);
  }

  const release = {
    id: `rel_${Date.now()}`,
    bounty_id: bountyId,
    amount: bounty.reward_amount,
    status: 'released',
    released_at: new Date().toISOString(),
  };

  return c.json({ data: release });
});

payments.post('/payments/refund/:bounty_id', async (c) => {
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, status, reward_amount')
    .eq('id', bountyId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (!['disputed', 'cancelled'].includes(bounty.status)) {
    return c.json({ error: 'Refund only available for disputed or cancelled bounties' }, 400);
  }

  const refund = {
    id: `ref_${Date.now()}`,
    bounty_id: bountyId,
    amount: bounty.reward_amount,
    status: 'refunded',
    refunded_at: new Date().toISOString(),
  };

  await supabase
    .from('bounties')
    .update({ status: 'refunded', updated_at: new Date().toISOString() })
    .eq('id', bountyId);

  return c.json({ data: refund });
});

export default payments;
