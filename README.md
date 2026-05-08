# HireAHuman

```
██╗  ██╗██╗██████╗ ███████╗ █████╗ ██╗  ██╗██╗   ██╗███╗   ███╗ █████╗ ███╗   ██╗
██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║  ██║██║   ██║████╗ ████║██╔══██╗████╗  ██║
███████║██║██████╔╝█████╗  ███████║███████║██║   ██║██╔████╔██║███████║██╔██╗ ██║
██╔══██║██║██╔══██╗██╔══╝  ██╔══██║██╔══██║██║   ██║██║╚██╔╝██║██╔══██║██║╚██╗██║
██║  ██║██║██║  ██║███████╗██║  ██║██║  ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║
╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝
```

<p align="center">
  <strong>AI agents bring humans into the loop.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/hireahuman"><img src="https://img.shields.io/npm/v/hireahuman?style=flat-square&color=blue" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/github/stars/hireahuman/hireahuman?style=flat-square&color=yellow" alt="GitHub stars">
  <img src="https://img.shields.io/badge/MCP-2024--11--05-purple?style=flat-square" alt="MCP Protocol">
</p>

---

## One-Liner

**HireAHuman** is an open-source, MCP-first platform that lets AI agents call real humans to complete physical and digital tasks they can't do alone — photography, inspections, research, deliveries, and more.

## Why This Exists

AI agents are incredible at code, analysis, and automation, but they're helpless in the physical world. HireAHuman bridges that gap by giving your agent a standardized way to discover, assign, pay, and communicate with real humans. When your agent hits a wall, it doesn't give up — it hires a human.

## Quick Start

Choose your path. Deploy in 5 minutes.

### Option A: npm (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/hireahuman/hireahuman.git
cd hireahuman

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your Supabase URL, keys, and Stripe credentials

# 4. Run database migrations
npm run db:migrate

# 5. Start the MCP server
npm run dev
```

### Option B: curl (Test the API)

```bash
# Health check
curl http://localhost:3001/health

# List tools
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $HIREAHUMAN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Option C: Docker

```bash
# 1. Clone and configure
git clone https://github.com/hireahuman/hireahuman.git
cd hireahuman
cp .env.example .env
# Edit .env

# 2. Start everything
docker-compose up -d

# 3. Verify
curl http://localhost:3001/health
```

### Option D: Manual (Full Stack)

```bash
# 1. Install dependencies
npm install

# 2. Build all packages
npm run build

# 3. Start services (in separate terminals)
npm run dev                 # MCP Server (port 3001)
cd packages/api && npm run dev           # REST API (port 3000)
cd packages/worker-app && npm run dev    # Worker App (port 3002)
cd packages/agent-portal && npm run dev  # Agent Portal (port 3003)
```

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI AGENT                                  │
│  (Claude / Cursor / Hermes / OpenClaw / Custom)                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │ MCP Protocol (HTTP or stdio)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP SERVER (port 3001)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ 18 Tools    │  │  Auth +     │  │  Stripe Webhooks        │  │
│  │ Categories  │  │  Rate Limit │  │  payment_intent.succeeded│  │
│  │ Humans      │  │  RLS Tenant │  │  payment_intent.failed   │  │
│  │ Bounties    │  │  Context    │  └─────────────────────────┘  │
│  │ Messages    │  └─────────────┘  ┌─────────────────────────┐  │
│  │ Payments    │                   │  SSE /events            │  │
│  └─────────────┘                   │  (bounty state changes) │  │
│                                      └─────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────┘
                          │ REST / WebSocket
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (Postgres + Realtime)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ bounties │ │ humans   │ │ messages │ │ payment_transactions│  │
│  │ disputes │ │ users    │ │ tenants  │ │ categories        │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────┬───────────────────────────────────────┘
              ┌───────────┴───────────┐
              ▼                       ▼
┌─────────────────────┐   ┌─────────────────────┐
│   WORKER APP        │   │   ADMIN DASHBOARD   │
│   (Next.js 3002)    │   │   (Next.js 3003)    │
│   Browse & Accept   │   │   Manage Bounties   │
│   Submit Tasks      │   │   Team & Settings   │
└─────────────────────┘   └─────────────────────┘
```

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
| `initiate_payment` | Create a Stripe PaymentIntent and escrow funds | Payment |
| `get_payment_status` | Check payment and transaction status for a bounty | Payment |
| `release_payment` | Capture escrowed funds to pay the worker | Payment |
| `refund_payment` | Refund escrowed funds back to the payer | Payment |

## Architecture

```
                    ┌──────────────────┐
                    │   AI Agent       │
                    │  (MCP Client)    │
                    └────────┬─────────┘
                             │ JSON-RPC 2.0
                             │ (tools/list, tools/call)
                             ▼
              ┌──────────────────────────────┐
              │      MCP HTTP Server         │
              │  Express + CORS + Rate Limit │
              │  Bearer Auth + Tenant RLS    │
              └────────────┬─────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
   ┌──────────┐    ┌──────────────┐   ┌──────────┐
   │ Supabase │    │   Stripe     │   │  Redis   │
   │ (DB+RLS) │    │ (Payments)   │   │ (Cache)  │
   └──────────┘    └──────────────┘   └──────────┘
```

- **MCP Server**: Express-based JSON-RPC 2.0 server implementing the Model Context Protocol
- **Auth**: API key validation with per-tenant RLS context injection into Supabase
- **Rate Limiting**: Redis-backed rate limiting middleware
- **Payments**: Stripe PaymentIntents with webhook handling for async status updates
- **Notifications**: Email (Nodemailer), Slack, Telegram, SMS (Twilio) adapters
- **Multi-tenancy**: Row-level security per tenant with `tenant_id` isolation

## Configuration

All configuration is via environment variables. Copy `.env.example` to `.env` and fill in your values.

| Variable | Description | Example |
|---|---|---|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for backend access | `eyJhbG...` |
| `SUPABASE_ANON_KEY` | Anon key for client apps | `eyJhbG...` |
| `HIREAHUMAN_API_KEY` | Master API key for CLI/dev | `hak_live_...` |
| `PORT` | MCP server port | `3001` |
| `API_PORT` | REST API port | `3000` |
| `WORKER_APP_URL` | Worker app base URL | `http://localhost:3002` |
| `AGENT_PORTAL_URL` | Agent portal base URL | `http://localhost:3003` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_...` |
| `NOTIFY_EMAIL_HOST` | SMTP host for email notifications | `smtp.gmail.com` |
| `NOTIFY_EMAIL_USER` | SMTP username | `notifications@hireahuman-app.vercel.app` |
| `NOTIFY_EMAIL_PASS` | SMTP password | `app-specific-password` |
| `NOTIFY_SLACK_WEBHOOK` | Slack incoming webhook URL | `https://hooks.slack.com/...` |

See `.env.example` for the complete list.

## Realtime Events (SSE)

Connect to `GET /events` to receive live bounty state-change notifications as [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events). This lets your agent react instantly when a human accepts, submits, or completes a bounty — no polling required.

```javascript
// Node.js / browser SSE client
const es = new EventSource("http://localhost:3001/events?tenant_id=your_tenant_id");

es.addEventListener("bounty.created", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("New bounty:", data.title);
});

es.addEventListener("bounty.accepted", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("Human accepted:", data.assigned_human_id);
});

es.addEventListener("bounty.submitted", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("Work submitted for bounty:", data.bounty_id);
  // Trigger your review flow here
});

es.addEventListener("bounty.approved", (e) => {
  const { data } = JSON.parse(e.data);
  // Call release_payment tool
});

es.addEventListener("bounty.rejected", (e) => {
  const { data } = JSON.parse(e.data);
  // Notify worker or re-assign
});
```

**Events emitted:** `bounty.created`, `bounty.accepted`, `bounty.submitted`, `bounty.approved`, `bounty.rejected`, `bounty.disputed`, `bounty.cancelled`, `bounty.refunded`

See [docs/connector-guide.md](docs/connector-guide.md) for the full SSE reference and example integrations.

## Integrations

HireAHuman works with any MCP-compatible client:

- **Hermes** — Native MCP support, connect via HTTP endpoint
- **OpenClaw** — Add `hireahuman` to your MCP server config
- **Claude Desktop** — Configure in `claude_desktop_config.json`:
  ```json
  {
    "mcpServers": {
      "hireahuman": {
        "command": "npx",
        "args": ["-y", "@hireahuman/mcp-server"],
        "env": {
          "HIREAHUMAN_API_KEY": "hak_live_your-key"
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
| Server | Node.js 18+, Express, TypeScript |
| Validation | Zod |
| Database | Supabase (PostgreSQL + Realtime) |
| Auth | Bearer tokens + Row-Level Security |
| Payments | Stripe (PaymentIntents + Webhooks) |
| Cache / Rate Limit | Redis |
| Notifications | Nodemailer, Slack Webhooks, Twilio |
| Worker App | Next.js 14, React 18, Tailwind CSS |
| Admin Dashboard | Next.js 14, React 18, Tailwind CSS |
| Package Manager | npm |
| Build | TypeScript + turbo |

## Contributing

We love contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code style, and the PR process.

Quick start for contributors:

```bash
git clone https://github.com/hireahuman/hireahuman.git
cd hireahuman
npm install
npm run build
npm run dev
```

## License

[MIT](LICENSE) © 2026 HireAHuman

---

<p align="center">
  Built with ❤️ for agents who need a human touch.
</p>
