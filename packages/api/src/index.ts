import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import health from './routes/health.js';
import humans from './routes/humans.js';
import bounties from './routes/bounties.js';
import tasks from './routes/tasks.js';
import messages from './routes/messages.js';
import disputes from './routes/disputes.js';
import payments from './routes/payments.js';
import { apiKeyMiddleware } from './middleware/api-key.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';

const app = new Hono();

app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
}));

app.use('*', logger());
app.use('*', rateLimitMiddleware);

app.get('/', (c) => c.json({ name: 'HireAHuman API', version: '0.1.0' }));

app.route('/api', health);

app.use('/api/*', apiKeyMiddleware);

app.route('/api', humans);
app.route('/api', bounties);
app.route('/api', tasks);
app.route('/api', messages);
app.route('/api', disputes);
app.route('/api', payments);

app.notFound((c) => c.json({ error: 'Not found' }, 404));

app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

const port = parseInt(process.env.PORT || '8080');

console.log(`HireAHuman API server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
