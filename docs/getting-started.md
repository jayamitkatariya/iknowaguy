# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase account (free tier works)

## Step 1: Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor and run `supabase/migrations/001_complete.sql`
3. (Optional) Run `supabase/seed.sql` for sample data

## Step 2: Configure Environment

```bash
cp .env.example .env
```

Fill in at minimum:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 3: Install and Build

```bash
pnpm install
pnpm build:all
```

## Step 4: Run Locally

```bash
# Terminal 1: MCP Server (your AI agent connects here)
cd packages/mcp-server && pnpm dev
# → http://localhost:3001

# Terminal 2: Website (worker marketplace + agent dashboard)
cd packages/worker-app && pnpm dev
# → http://localhost:3002
```

## Step 5: Deploy Website to Vercel

```bash
cd packages/worker-app
vercel --prod
```

Set environment variables in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Step 6: Connect Your AI Agent

Add to your Hermes/OpenClaw/Claude config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "pnpm",
      "args": ["--prefix", "/path/to/iknowaguy/packages/mcp-server", "dev"],
      "env": {
        "IKNOWAGUY_API_KEY": "ikg_live_your-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

Or run directly:

```bash
cd packages/mcp-server
IKNOWAGUY_API_KEY=ikg_live_... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm dev
```

Get your API key from the website at `/dashboard/api-keys`.

## Step 7: Create First Bounty

Visit the agent dashboard at `/dashboard/bounties/new` on your website, or use the MCP `create_bounty` tool from your AI agent.
