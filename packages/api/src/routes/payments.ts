import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { createPaymentIntent, capturePayment, refundPayment, createConnectAccount, createAccountLink, createTransfer, getAccountStatus } from '@iknowaguy/shared/payments';
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

// ─── Stripe Connect Routes ─────────────────────────────────────────────────────

// Create a Stripe Connect account for a worker
payments.post('/connect/account', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const schema = z.object({
    human_id: z.string().uuid(),
    email: z.string().email(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  // Verify the human belongs to this tenant
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('id', parsed.data.human_id)
    .eq('tenant_id', tenantId)
    .single();

  if (userError || !user) {
    return c.json({ error: 'Human worker not found' }, 404);
  }

  if (user.role !== 'human') {
    return c.json({ error: 'User is not a human worker' }, 400);
  }

  // Check if already has stripe_account_id
  const { data: profile } = await supabase
    .from('human_profiles')
    .select('stripe_account_id')
    .eq('id', parsed.data.human_id)
    .maybeSingle();

  if (profile?.stripe_account_id) {
    return c.json({
      data: {
        stripe_account_id: profile.stripe_account_id,
        message: 'Worker already has a Stripe Connect account',
      },
    });
  }

  try {
    const account = await createConnectAccount(parsed.data.email, {
      human_id: parsed.data.human_id,
      tenant_id: tenantId,
    });

    // Save to human_profiles
    await supabase
      .from('human_profiles')
      .update({ stripe_account_id: account.id })
      .eq('id', parsed.data.human_id);

    return c.json({
      data: {
        stripe_account_id: account.id,
        email: parsed.data.email,
        created_at: new Date().toISOString(),
      },
    }, 201);
  } catch (err: any) {
    console.error('[payments:connect] Account creation error:', err);
    return c.json({ error: 'Failed to create Connect account', details: err.message }, 500);
  }
});

// Get an onboarding link for a worker's Stripe Connect account
payments.post('/connect/account-link', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const schema = z.object({
    human_id: z.string().uuid(),
    refresh_url: z.string().url(),
    return_url: z.string().url(),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  // Verify the human belongs to this tenant
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', parsed.data.human_id)
    .eq('tenant_id', tenantId)
    .single();

  if (userError || !user) {
    return c.json({ error: 'Human worker not found' }, 404);
  }

  // Get their stripe_account_id
  const { data: profile, error: profileError } = await supabase
    .from('human_profiles')
    .select('stripe_account_id')
    .eq('id', parsed.data.human_id)
    .single();

  if (profileError || !profile?.stripe_account_id) {
    return c.json({ error: 'Worker has not created a Stripe Connect account yet' }, 400);
  }

  try {
    const accountLink = await createAccountLink(
      profile.stripe_account_id,
      parsed.data.refresh_url,
      parsed.data.return_url
    );

    const linkResult = accountLink as any;

    return c.json({
      data: {
        url: linkResult.url,
        stripe_account_id: profile.stripe_account_id,
        expires_at: linkResult.expires_at,
      },
    });
  } catch (err: any) {
    console.error('[payments:connect] Account link error:', err);
    return c.json({ error: 'Failed to create account link', details: err.message }, 500);
  }
});

// Get Connect account status for a worker
payments.get('/connect/account-status/:human_id', async (c) => {
  const tenantId = c.get('tenantId');
  const humanId = c.req.param('human_id');

  // Verify the human belongs to this tenant
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', humanId)
    .eq('tenant_id', tenantId)
    .single();

  if (userError || !user) {
    return c.json({ error: 'Human worker not found' }, 404);
  }

  const { data: profile, error: profileError } = await supabase
    .from('human_profiles')
    .select('stripe_account_id')
    .eq('id', humanId)
    .single();

  if (profileError || !profile?.stripe_account_id) {
    return c.json({ error: 'Worker has not created a Stripe Connect account yet' }, 400);
  }

  try {
    const status = await getAccountStatus(profile.stripe_account_id);

    return c.json({
      data: {
        stripe_account_id: profile.stripe_account_id,
        charges_enabled: status.charges_enabled,
        payouts_enabled: status.payouts_enabled,
        details_submitted: status.details_submitted,
      },
    });
  } catch (err: any) {
    console.error('[payments:connect] Account status error:', err);
    return c.json({ error: 'Failed to get account status', details: err.message }, 500);
  }
});

// Transfer earnings to a worker's Stripe Connect account
payments.post('/connect/transfer', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const schema = z.object({
    bounty_id: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'EUR', 'GBP', 'INR']).default('USD'),
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  // Get the bounty and verify it belongs to this tenant
  const { data: bounty, error: bountyError } = await supabase
    .from('bounties')
    .select('id, tenant_id, assigned_human_id, reward_amount')
    .eq('id', parsed.data.bounty_id)
    .eq('tenant_id', tenantId)
    .single();

  if (bountyError || !bounty) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  if (!bounty.assigned_human_id) {
    return c.json({ error: 'Bounty has no assigned worker' }, 400);
  }

  // Get worker's Stripe Connect account
  const { data: profile, error: profileError } = await supabase
    .from('human_profiles')
    .select('stripe_account_id')
    .eq('id', bounty.assigned_human_id)
    .single();

  if (profileError || !profile?.stripe_account_id) {
    return c.json({ error: 'Worker has not set up their Stripe Connect account yet' }, 400);
  }

  // Check if account is fully onboarded
  try {
    const status = await getAccountStatus(profile.stripe_account_id);

    if (!status.details_submitted) {
      return c.json({
        error: 'Worker has not completed Stripe onboarding',
        data: {
          stripe_account_id: profile.stripe_account_id,
          charges_enabled: status.charges_enabled,
          payouts_enabled: status.payouts_enabled,
          details_submitted: status.details_submitted,
        },
      }, 400);
    }

    // Create the transfer
    const transfer = await createTransfer(
      parsed.data.amount,
      profile.stripe_account_id,
      parsed.data.currency,
      {
        bounty_id: parsed.data.bounty_id,
        tenant_id: tenantId,
      }
    );

    const transferResult = transfer as any;

    // Record in payment_transactions
    await supabase.from('payment_transactions').insert({
      bounty_id: parsed.data.bounty_id,
      human_id: bounty.assigned_human_id,
      tenant_id: tenantId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      type: 'bounty_payment',
      status: 'completed',
      metadata: { transfer_id: transferResult.id },
    });

    return c.json({
      data: {
        transfer_id: transferResult.id,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        destination: profile.stripe_account_id,
        bounty_id: parsed.data.bounty_id,
        transferred_at: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[payments:connect] Transfer error:', err);
    return c.json({ error: 'Transfer failed', details: err.message }, 500);
  }
});

export default payments;