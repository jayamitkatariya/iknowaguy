import { Hono } from 'hono';
import { z } from 'zod';
import { supabase } from '../lib/supabase.js';
import { randomBytes, createHash } from 'crypto';

const auth = new Hono();

// Schema for tenant registration
const registerSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

// Schema for API key request (when existing tenant wants new key)
const requestApiKeySchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Generate a secure API key
function generateApiKey(): string {
  return `hah_${randomBytes(32).toString('hex')}`;
}

// Hash API key for storage (store prefix + hash, not raw key)
// NOTE: For production, use bcrypt or argon2 with salt. This MVP uses plain SHA256.
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

// Register a new tenant with initial admin user
auth.post('/register', async (c) => {
  const body = await c.req.json();
  
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { name, slug, email, password } = parsed.data;

  // Check if slug is already taken
  const { data: existingTenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingTenant) {
    return c.json({ error: 'Slug is already taken' }, 409);
  }

  // Check if email is already registered
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();

  if (existingUser) {
    return c.json({ error: 'Email is already registered' }, 409);
  }

  // Generate API key for the tenant
  const rawApiKey = generateApiKey();
  const hashedApiKey = hashApiKey(rawApiKey);

  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name,
      slug,
      api_key_hash: hashedApiKey,
      settings: { plan: 'free', rate_limit: 100 },
    })
    .select('id, name, slug, created_at')
    .single();

  if (tenantError || !tenant) {
    console.error('Tenant creation error:', tenantError);
    return c.json({ error: 'Failed to create tenant' }, 500);
  }

  // Create initial admin user
  const { data: user, error: userError } = await supabase
    .from('users')
    .insert({
      tenant_id: tenant.id,
      email: email.toLowerCase(),
      password_hash: createHash('sha256').update(password).digest('hex'),
      role: 'admin',
      is_active: true,
    })
    .select('id, email, role')
    .single();

  if (userError || !user) {
    console.error('User creation error:', userError);
    // Rollback tenant creation
    await supabase.from('tenants').delete().eq('id', tenant.id);
    return c.json({ error: 'Failed to create user' }, 500);
  }

  return c.json({
    data: {
      tenant,
      user,
      api_key: rawApiKey, // Only returned once, never stored in plaintext
    }
  }, 201);
});

// Login to get/regenerate API key
auth.post('/login', async (c) => {
  const body = await c.req.json();

  const parsed = requestApiKeySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;
  const passwordHash = createHash('sha256').update(password).digest('hex');

  // Find user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, tenant_id, email, password_hash, role, is_active, tenants:tenant_id(id, name, slug)')
    .eq('email', email.toLowerCase())
    .single();

  if (userError || !user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  if (!user.is_active) {
    return c.json({ error: 'Account is deactivated' }, 403);
  }

  if (user.password_hash !== passwordHash) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Get tenant and generate new API key
  const rawApiKey = generateApiKey();
  const hashedApiKey = hashApiKey(rawApiKey);

  const { error: updateError } = await supabase
    .from('tenants')
    .update({ api_key_hash: hashedApiKey })
    .eq('id', user.tenant_id);

  if (updateError) {
    console.error('API key update error:', updateError);
    return c.json({ error: 'Failed to generate API key' }, 500);
  }

  return c.json({
    data: {
      tenant: user.tenants,
      user: { id: user.id, email: user.email, role: user.role },
      api_key: rawApiKey,
    }
  });
});

// Verify API key (for checking if key is valid)
auth.post('/verify', async (c) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid Authorization header' }, 401);
  }

  const apiKey = authHeader.slice(7);
  const hashedKey = hashApiKey(apiKey);

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, name, slug, settings')
    .eq('api_key_hash', hashedKey)
    .single();

  if (error || !tenant) {
    return c.json({ error: 'Invalid API key' }, 401);
  }

  return c.json({
    data: {
      valid: true,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    }
  });
});

export default auth;
