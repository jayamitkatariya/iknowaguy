# Getting Started

## Prerequisites

- Node.js 20+
- Supabase account
- A deployed MCP server URL

## Step 1: Set Up Supabase

1. Create a project at supabase.com
2. Run `supabase/migrations/001_initial.sql`
3. Run `supabase/seed.sql` (optional)
4. Copy your project URL and keys

## Step 2: Configure Environment Variables

```bash
# packages/mcp-server/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001

# packages/api/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3000

# packages/worker-app/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# packages/admin-dashboard/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Install and Build

```bash
npm install
npm run build
```

## Step 4: Deploy

```bash
# MCP Server (Railway, Render, etc.)
cd packages/mcp-server && npx tsx src/index.ts

# REST API
cd packages/api && npx tsx src/index.ts

# Worker App (Vercel)
cd packages/worker-app && npm run build

# Admin Dashboard (Vercel)
cd packages/admin-dashboard && npm run build
```

## Step 5: Create Your First Tenant

```sql
INSERT INTO tenants (name, slug, api_key, api_key_prefix, contact_email)
VALUES (
  'My Team',
  'my-team',
  'hak_live_abcdef123456',
  'hak_live_ab',
  'team@example.com'
);
```

## Step 6: Connect Your AI Agent

```json
{
  "mcp_servers": [
    {
      "name": "hireahuman",
      "url": "https://your-mcp-server.com/mcp",
      "api_key": "hak_live_abcdef123456"
    }
  ]
}
```
