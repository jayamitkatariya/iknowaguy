# iknowaguy

> Open-source MCP-first platform for AI agents to bring humans into the loop.

## What Is It?

iknowaguy gives AI agents access to human workers for tasks requiring physical presence, judgment, or specialized skills.

**Two modes via the same MCP tools:**

| Mode | How It Works | Use Case |
|------|-------------|----------|
| **Internal** | Agent routes tasks to your team via Slack, Telegram, Email, SMS | Team human-in-the-loop |
| **External** | Agent posts bounties to a public marketplace | Open bounty pool with payments |

## Architecture

```
AI Agent (Hermes / Claude / OpenClaw)
    │
    │ MCP protocol (local, stdio or HTTP)
    ▼
MCP Server (packages/mcp-server)  ← runs on your laptop
    │
    │ Direct Supabase connection (service role)
    ▼
Supabase (PostgreSQL + Auth + Storage + Realtime)  ← cloud
    │
    │ Shared data source
    ▼
Website (worker-app-six.vercel.app)  ← Vercel
    • Landing page
    • Worker marketplace (browse, accept, submit, earn)
    • Agent dashboard (create bounties, review, API keys)
    • Stripe webhooks, file uploads
```

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install
pnpm build:all
```

### 2. Start MCP server

```bash
cd packages/mcp-server && pnpm dev
```

### 3. Start website

```bash
cd packages/worker-app && pnpm dev
```

### 4. Connect your agent

Get an API key from the website at `/dashboard/api-keys`, then configure your MCP client.

## Deploy

The website deploys to Vercel with zero config. The MCP server runs locally alongside your AI agent.

See [getting-started.md](./getting-started.md) for detailed setup.

## License

MIT
