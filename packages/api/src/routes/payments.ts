import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { createPaymentIntent, capturePayment, refundPayment } from '@hireahuman/shared/payments';
import type { Env } from '../middleware/api-key.js';

const payments = new Hono<Env>();

const initiatePaymentSchema = z.object({
  bounty_id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('USD'),
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

  try {
    const paymentIntent = await createPaymentIntent(
      parsed.data.amount,
      parsed.data.currency as any,
      {
        bounty_id: parsed.data.bounty_id,
        tenant_id: tenantId,
      }
    );

    const piResult = paymentIntent as any;

    const { error: insertError } = await supabase
      .from('payment_transactions')
      .insert({
        bounty_id: parsed.data.bounty_id,
        tenant_id: tenantId,
        stripe_payment_intent_id: piResult.id,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        status: piResult.status,
      });

    if (insertError) {
      console.error('[payments:initiate] Failed to insert payment_transactions:', insertError);
    }

    return c.json({
      data: {
        id: piResult.id,
        bounty_id: parsed.data.bounty_id,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        status: piResult.status,
        created_at: new Date().toISOString(),
      },
    }, 201);
  } catch (err: any) {
    console.error('[payments:initiate] Stripe error:', err);
    return c.json({ error: 'Payment initiation failed', details: err.message }, 500);
  }
});

payments.get('/payments/status/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  const { data: transaction, error } = await supabase
    .from('payment_transactions')
    .select('id, stripe_payment_intent_id, amount, currency, status, created_at')
    .eq('bounty_id', bountyId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[payments:status] Query error:', error);
    return c.json({ error: 'Failed to query payment status' }, 500);
  }

  if (!transaction) {
    return c.json({ error: 'No payment found for this bounty' }, 404);
  }

  return c.json({
    data: {
      bounty_id: bountyId,
      payment_intent_id: transaction.stripe_payment_intent_id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status,
      created_at: transaction.created_at,
    },
  });
});

payments.post('/payments/release/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, status, reward_amount, assigned_human_id')
    .eq('id', bountyId)
    .eq('tenant_id', tenantId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (bounty.status !== 'completed') {
    return c.json({ error: 'Bounty must be completed before releasing payment' }, 400);
  }

  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .select('id, stripe_payment_intent_id, status')
    .eq('bounty_id', bountyId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (txError || !transaction) {
    return c.json({ error: 'No payment transaction found for this bounty' }, 404);
  }

  try {
    const result = await capturePayment(transaction.stripe_payment_intent_id);
    const capturedResult = result as any;

    const { error: txUpdateError } = await supabase
      .from('payment_transactions')
      .update({ status: capturedResult.status })
      .eq('id', transaction.id);

    if (txUpdateError) {
      console.error('[payments:release] Failed to update transaction status:', txUpdateError);
    }

    const { error: bountyUpdateError } = await supabase
      .from('bounties')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', bountyId);

    if (bountyUpdateError) {
      console.error('[payments:release] Failed to update bounty status:', bountyUpdateError);
    }

    return c.json({
      data: {
        id: transaction.id,
        bounty_id: bountyId,
        payment_intent_id: transaction.stripe_payment_intent_id,
        amount: bounty.reward_amount,
        status: capturedResult.status,
        released_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[payments:release] Capture error:', err);
    return c.json({ error: 'Payment release failed', details: err.message }, 500);
  }
});

payments.post('/payments/refund/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, status, reward_amount')
    .eq('id', bountyId)
    .eq('tenant_id', tenantId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (!['disputed', 'cancelled'].includes(bounty.status)) {
    return c.json({ error: 'Refund only available for disputed or cancelled bounties' }, 400);
  }

  const { data: transaction, error: txError } = await supabase
    .from('payment_transactions')
    .select('id, stripe_payment_intent_id, amount, status')
    .eq('bounty_id', bountyId)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (txError || !transaction) {
    return c.json({ error: 'No payment transaction found for this bounty' }, 404);
  }

  try {
    const result = await refundPayment(transaction.stripe_payment_intent_id);
    const refundResult = result as any;

    const { error: txUpdateError } = await supabase
      .from('payment_transactions')
      .update({ status: 'refunded' })
      .eq('id', transaction.id);

    if (txUpdateError) {
      console.error('[payments:refund] Failed to update transaction status:', txUpdateError);
    }

    const { error: bountyUpdateError } = await supabase
      .from('bounties')
      .update({ status: 'refunded', updated_at: new Date().toISOString() })
      .eq('id', bountyId);

    if (bountyUpdateError) {
      console.error('[payments:refund] Failed to update bounty status:', bountyUpdateError);
    }

    return c.json({
      data: {
        id: refundResult.id ?? transaction.id,
        bounty_id: bountyId,
        payment_intent_id: transaction.stripe_payment_intent_id,
        amount: transaction.amount,
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[payments:refund] Refund error:', err);
    return c.json({ error: 'Refund failed', details: err.message }, 500);
  }
});

export default payments;