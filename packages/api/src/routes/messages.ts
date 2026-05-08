import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const messages = new Hono<Env>();

const sendMessageSchema = z.object({
  bounty_id: z.string().uuid(),
  content: z.string().min(1).max(5000),
  attachments: z.array(z.string()).optional(),
});

messages.get('/messages/:bounty_id', async (c) => {
  const tenantId = c.get('tenantId');
  const bountyId = c.req.param('bounty_id');

  const { data: bountyCheck } = await supabase
    .from('bounties')
    .select('id')
    .eq('id', bountyId)
    .eq('tenant_id', tenantId)
    .single();

  if (!bountyCheck) {
    return c.json({ error: 'Bounty not found or not accessible' }, 404);
  }

  const { data, error } = await supabase
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

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

messages.post('/messages', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = sendMessageSchema.safeParse(body);
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

  // Look up the first user in this tenant to use as sender
  const { data: senderUser } = await supabase
    .from('users')
    .select('id')
    .eq('tenant_id', tenantId)
    .limit(1)
    .single();

  if (!senderUser) {
    return c.json({ error: 'No user found for tenant' }, 400);
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      bounty_id: parsed.data.bounty_id,
      sender_id: senderUser.id,
      content: parsed.data.content,
      attachments: parsed.data.attachments || [],
    })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data }, 201);
});

export default messages;
