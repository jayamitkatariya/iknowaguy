import "dotenv/config";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import health from './routes/health.js';
import auth from './routes/auth.js';
import humans from './routes/humans.js';
import bounties from './routes/bounties.js';
import tasks from './routes/tasks.js';
import messages from './routes/messages.js';
import disputes from './routes/disputes.js';
import categories from './routes/categories.js';
import payments from './routes/payments.js';
import { constructWebhookEvent, getAccountStatus } from '@iknowaguy/shared/payments';
import { supabase } from './lib/supabase.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { apiKeyMiddleware } from './middleware/api-key.js';

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

const app = new Hono();

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

app.use('*', cors({
  origin: corsOrigins,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
}));

const csrfMiddleware: import('hono').MiddlewareHandler = async (c, next) => {
  const method = c.req.method;
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return next();
  }

  const origin = c.req.header('Origin');
  if (!origin) {
    return c.json({ error: 'Missing Origin header' }, 403);
  }

  const allowed = corsOrigins.some((allowedOrigin) => {
    try {
      const allowedUrl = new URL(allowedOrigin);
      const originUrl = new URL(origin);
      return allowedUrl.origin === originUrl.origin;
    } catch {
      return allowedOrigin === origin;
    }
  });

  if (!allowed) {
    return c.json({ error: 'Forbidden: invalid Origin' }, 403);
  }

  return next();
};

app.use('*', logger());
app.use('*', rateLimitMiddleware);
app.use('/api/*', csrfMiddleware);

app.get('/', (c) => c.json({ name: 'iknowaguy API', version: '0.1.0' }));

// Public routes — mounted BEFORE apiKeyMiddleware so they bypass auth
app.route('/api/health', health);        // /api/health — public health check
app.route('/api/categories', categories); // /api/categories — public, no auth required
app.route('/auth', auth);                 // /auth/* — login/register, no API key required

app.use('/api/*', apiKeyMiddleware);     // All other /api/* routes require API key

app.get('/connect/account-status', async (c) => {
  const stripeAccountId = c.req.query('stripeAccountId');
  if (!stripeAccountId) {
    return c.json({ error: 'Missing stripeAccountId query parameter' }, 400);
  }

  try {
    const status = await getAccountStatus(stripeAccountId);
    return c.json({
      data: {
        stripe_account_id: stripeAccountId,
        charges_enabled: status.charges_enabled,
        payouts_enabled: status.payouts_enabled,
        details_submitted: status.details_submitted,
      },
    });
  } catch (err: any) {
    console.error('[connect:account-status] Error:', err.message);
    return c.json({ error: 'Failed to get account status', details: err.message }, 500);
  }
});

// Protected API routes
app.route('/api', humans);
app.route('/api', bounties);
app.route('/api', tasks);
app.route('/api', messages);
app.route('/api', disputes);
app.route('/api', payments);

app.post('/webhooks/stripe', async (c) => {
  const body = await c.req.text();
  const signature = c.req.header('stripe-signature') || '';
  const secret = process.env.STRIPE_WEBHOOK_SECRET || '';

  try {
    const event = constructWebhookEvent(body, signature, secret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as any;
        console.log('[webhook:stripe] payment_intent.succeeded:', pi.id);
        const { error: updateErr } = await supabase
          .from('payment_transactions')
          .update({ status: 'succeeded' })
          .eq('stripe_payment_intent_id', pi.id);
        if (updateErr) {
          console.error('[webhook:stripe] Failed to update transaction status:', updateErr);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as any;
        console.log('[webhook:stripe] payment_intent.payment_failed:', pi.id);
        const { error: updateErr } = await supabase
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', pi.id);
        if (updateErr) {
          console.error('[webhook:stripe] Failed to update transaction status:', updateErr);
        }
        break;
      }
      default:
        console.log('[webhook:stripe] Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (err: any) {
    console.error('[webhook:stripe] Verification failed:', err.message);
    return c.json({ error: 'Webhook verification failed' }, 400);
  }
});

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  const message = err.message || 'Internal server error';
  const isClientError = err instanceof Error && (err as any).status >= 400 && (err as any).status < 500;
  const safeMessage = isClientError ? message : 'Internal server error';
  const status = isClientError ? (err as any).status : 500;
  return c.json({ error: safeMessage }, status);
});

const port = parseInt(process.env.API_PORT || process.env.PORT || '3000') || 3000;

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`iknowaguy API server running on port ${info.port}`);
});