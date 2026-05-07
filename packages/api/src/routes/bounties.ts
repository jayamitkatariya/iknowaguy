import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import type { Env } from '../middleware/api-key.js';

const bounties = new Hono<Env>();

const createBountySchema = z.object({
  category_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  instructions: z.string().optional(),
  location_address: z.string().optional(),
  location_lat: z.number().optional(),
  location_lng: z.number().optional(),
  reward_amount: z.number().positive(),
  currency: z.string().default('USD'),
  deadline: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const _updateBountySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).optional(),
  instructions: z.string().optional(),
  reward_amount: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

bounties.get('/bounties', async (c) => {
  const tenantId = c.get('tenantId');
  const status = c.req.query('status');
  const category_id = c.req.query('category_id');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = (page - 1) * limit;

  let query = supabase
    .from('bounties')
    .select(`
      *,
      category:categories(name, slug, icon),
      assigned_human:human_profiles(full_name, avatar_url, rating)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('status', status);
  if (category_id) query = query.eq('category_id', category_id);

  const { data, error } = await query;

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  let countQuery = supabase
    .from('bounties')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (status) countQuery = countQuery.eq('status', status);
  if (category_id) countQuery = countQuery.eq('category_id', category_id);

  const { count } = await countQuery;

  return c.json({ data, meta: { page, limit, total: count ?? 0 } });
});

bounties.get('/bounties/:id', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');

  const { data, error } = await supabase
    .from('bounties')
    .select(`
      *,
      category:categories(name, slug, icon),
      assigned_human:human_profiles(full_name, avatar_url, rating),
      submissions:task_submissions(id, status, created_at, content, media_urls)
    `)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
  }

  return c.json({ data });
});

bounties.post('/bounties', async (c) => {
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = createBountySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase
    .from('bounties')
    .insert({ tenant_id: tenantId, ...parsed.data })
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data }, 201);
});

const acceptBountySchema = z.object({
  human_id: z.string().uuid(),
});

bounties.post('/bounties/:id/accept', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = acceptBountySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { human_id } = parsed.data;

  const { data, error } = await supabase
    .from('bounties')
    .update({ assigned_human_id: human_id, status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .eq('status', 'open')
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!data) {
    return c.json({ error: 'Bounty is not available for acceptance' }, 409);
  }

  return c.json({ data });
});

const completeBountySchema = z.object({
  content: z.string().max(5000).optional(),
  media_urls: z.array(z.string()).optional(),
});

bounties.post('/bounties/:id/complete', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = completeBountySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { content, media_urls } = parsed.data;

  const bounty = await supabase
    .from('bounties')
    .select('assigned_human_id')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single();

  if (!bounty.data?.assigned_human_id) {
    return c.json({ error: 'Bounty has no assigned human' }, 400);
  }

  const { data: submission, error: subError } = await supabase
    .from('task_submissions')
    .insert({
      bounty_id: id,
      human_id: bounty.data.assigned_human_id,
      content,
      media_urls: media_urls || [],
    })
    .select()
    .single();

  if (subError) {
    return c.json({ error: subError.message }, 500);
  }

  const { data, error } = await supabase
    .from('bounties')
    .update({ status: 'submitted', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data, submission });
});

const reviewBountySchema = z.object({
  decision: z.enum(['approved', 'rejected']),
  notes: z.string().max(5000).optional(),
});

bounties.post('/bounties/:id/review', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = reviewBountySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { decision, notes } = parsed.data;

  const newStatus = decision === 'approved' ? 'completed' : 'open';
  const submissionStatus = decision === 'approved' ? 'approved' : 'rejected';

  const { error: subError } = await supabase
    .from('task_submissions')
    .update({ status: submissionStatus, reviewer_notes: notes, updated_at: new Date().toISOString() })
    .eq('bounty_id', id)
    .eq('status', 'submitted');

  if (subError) {
    return c.json({ error: subError.message }, 500);
  }

  const { data, error } = await supabase
    .from('bounties')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  return c.json({ data });
});

bounties.patch('/bounties/:id', async (c) => {
  const id = c.req.param('id');
  const tenantId = c.get('tenantId');
  const body = await c.req.json();

  const parsed = _updateBountySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { data, error } = await supabase
    .from('bounties')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    return c.json({ error: error.message }, 500);
  }

  if (!data) {
    return c.json({ error: 'Bounty not found' }, 404);
  }

  return c.json({ data });
});

export default bounties;
