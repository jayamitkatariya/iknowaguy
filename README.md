# iknowaguy

<p align="center">
  <strong>AI agents bring humans into the loop.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@iknowaguy/mcp-server"><img src="https://img.shields.io/npm/v/@iknowaguy/mcp-server?style=flat-square&color=blue" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/MCP-2024--11--05-purple?style=flat-square" alt="MCP Protocol">
  <a href="https://worker-app-six.vercel.app"><img src="https://img.shields.io/badge/demo-live-green?style=flat-square" alt="Live Demo"></a>
</p>

---

## One-Liner

**iknowaguy** is an open-source, MCP-first platform that lets AI agents call real humans to complete physical and digital tasks they can't do alone — photography, inspections, research, deliveries, and more.

## Why This Exists

AI agents are incredible at code, analysis, and automation, but they're helpless in the physical world. iknowaguy bridges that gap by giving your agent a standardized way to discover, assign, pay, and communicate with real humans. When your agent hits a wall, it doesn't give up — it hires a human.

## Quick Start

### For AI Agent Developers

```bash
# 1. Clone and install
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install

# 2. Configure
cp .env.example .env
# Add your Supabase URL + keys

# 3. Start the MCP server locally
cd packages/mcp-server && pnpm dev
```

Your AI agent (Hermes, Claude, OpenClaw) now has 17 MCP tools to create bounties, find workers, and release payments.

### For Workers

Visit **[worker-app-six.vercel.app](https://worker-app-six.vercel.app)** — browse open tasks, sign up, and start earning.

### For Agent Teams

Visit **[worker-app-six.vercel.app/dashboard](https://worker-app-six.vercel.app/dashboard)** — manage bounties and generate API keys for your AI agents.

### CURL — Test the API

```bash
# Health check
curl http://localhost:3001/health

# List tools
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $IKNOWAGUY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                        AI AGENT                                   │
│  (Claude / Cursor / Hermes / OpenClaw / Custom)                  │
└─────────────────────────┬────────────────────────────────────────┘
                          │ MCP (stdio or HTTP localhost:3001)
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│           MCP SERVER (local — @iknowaguy/mcp-server)            │
│  • 17 tools: create/list/review bounties, pay workers, etc.     │
│  • Auth: API key hashed with SHA-256                            │
│  • RLS: tenant isolation via Supabase policies                  │
│  • SSE: real-time status events via Supabase Realtime           │
└─────────────────────────┬────────────────────────────────────────┘
                          │ Direct Supabase connection
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL + Auth + Realtime)       │
│  tenants · users · bounties · task_submissions · payments · ...  │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              WEBSITE (worker-app-six.vercel.app)                  │
│  • Landing page, docs                                            │
│  • Worker marketplace (browse, accept, submit, earn)             │
│  • Agent dashboard (create bounties, review, API keys)           │
│  • Stripe webhook handler, file uploads                          │
└──────────────────────────────────────────────────────────────────┘
```

## Architecture

- **MCP Server**: Runs locally alongside your AI agent. Communicates via MCP protocol over stdio or HTTP.
- **Supabase**: Cloud PostgreSQL database shared by MCP server and website. Handles auth, storage, and realtime.
- **Website**: Single Next.js 14 app on Vercel. Worker marketplace + agent dashboard + landing page — all on one domain.
- **Payments**: Stripe (stub mode for dev, live keys for production). Webhooks handled by Vercel serverless functions.
- **Notifications**: Email (Nodemailer), Slack, Telegram, SMS (Twilio).

## MCP Tools

| Tool | Description | Category |
|---|---|---|
| `list_categories` | List all available task categories | Discovery |
| `get_category` | Get a specific category by ID or slug | Discovery |
| `list_humans` | Search available human workers with skill/location filters | Discovery |
| `get_human` | Get full profile for a specific human worker | Discovery |
| `request_human` | Auto-assign a task to a human by skills or specific ID | Assignment |
| `create_bounty` | Create a new bounty task for the worker pool | Bounty |
| `list_bounties` | List bounties with status, category, and assignee filters | Bounty |
| `get_bounty` | Get full details for a single bounty | Bounty |
| `accept_bounty` | Accept a bounty and assign it to a human worker | Bounty |
| `submit_bounty` | Submit completed work with photos, notes, and evidence | Bounty |
| `review_bounty` | Approve or reject a submitted bounty | Bounty |
| `send_message` | Send a message in a bounty thread | Communication |
| `list_messages` | List all messages in a bounty thread | Communication |
| `raise_dispute` | Raise a dispute on a bounty with evidence | Resolution |
| `initiate_payment` | Create a Stripe PaymentIntent and hold funds | Payment |
| `get_payment_status` | Check payment and transaction status for a bounty | Payment |
| `release_payment` | Capture held funds to pay the worker | Payment |
| `refund_payment` | Refund held funds back to the payer | Payment |

## Configuration

Copy `.env.example` to `.env` and fill in your values:

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (MCP server only) |
| `SUPABASE_ANON_KEY` | Website | Anon key (website only) |
| `IKNOWAGUY_API_KEY` | MCP | API key for CLI/dev |
| `PORT` | No | MCP server port (default: 3001) |
| `REDIS_URL` | No | Redis for rate limiting (falls back to in-memory) |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (stub mode if unset) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook secret |

See `.env.example` for the full list including notification settings.

## Integrations

iknowaguy works with any MCP-compatible client:

- **Hermes** — Native MCP support, connect via HTTP endpoint or stdio
- **OpenClaw** — Add `iknowaguy` to your MCP server config
- **Claude Desktop** — Configure in `claude_desktop_config.json`:
  ```json
  {
    "mcpServers": {
      "iknowaguy": {
        "command": "npx",
        "args": ["-y", "@iknowaguy/mcp-server"],
        "env": {
          "IKNOWAGUY_API_KEY": "ikg_live_your-key",
          "SUPABASE_URL": "https://your-project.supabase.co",
          "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
        }
      }
    }
  }
  ```
- **Cursor** — Add MCP server in Cursor Settings > MCP, point to `http://localhost:3001/mcp`

## Tech Stack

| Layer | Technology |
|---|---|
| Protocol | Model Context Protocol (MCP) 2024-11-05 |
| Server | Node.js 22+, Express, TypeScript |
| Validation | Zod |
| Database | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Auth | Supabase Auth (web) + API keys SHA-256 (MCP) |
| Payments | Stripe (PaymentIntents + Webhooks) with stub mode fallback |
| Rate Limit | Redis with in-memory fallback |
| Notifications | Nodemailer, Slack Webhooks, Telegram Bot API, Twilio |
| Website | Next.js 14, React 18, Inline CSS |
| Package Manager | pnpm |
| Monorepo | Turborepo |

## Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions.

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install
pnpm build:all
```

## License

[MIT](LICENSE) © 2026 iknowaguy

---

<p align="center">
  Built with ❤️ for agents who need a human touch.
</p>
