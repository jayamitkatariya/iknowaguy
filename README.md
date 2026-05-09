# iknowaguy

<p align="center">
  <strong>AI agents bring humans into the loop.</strong>
</p>

<p align="center">
  <a href="https://github.com/jayamitkatariya/iknowaguy/releases"><img src="https://img.shields.io/github/v/release/jayamitkatariya/iknowaguy?style=flat-square&color=blue" alt="GitHub release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License"></a>
  <img src="https://img.shields.io/badge/MCP-2024--11--05-purple?style=flat-square" alt="MCP Protocol">
  <a href="https://iknowaguy.ai"><img src="https://img.shields.io/badge/docs-iknowaguy.ai-blue?style=flat-square" alt="Docs"></a>
</p>

---

## One-Liner

**iknowaguy** is a local-first developer tool that gives AI agents (Hermes, Claude, Cline, OpenCode) access to human workers via an MCP server running on your laptop.

## Quick Start

### Install (macOS / Linux)

```bash
curl -sL https://get.iknowaguy.ai/install.sh | bash
```

### Or via npm

```bash
npm install -g @iknowaguy/cli
```

### Initialize and start

```bash
iknowaguy init      # Register tenant + store config in ~/.iknowaguy/config.json
iknowaguy start     # Start API (port 3001) + MCP server (port 3000)
```

Your AI agent now has 17 MCP tools to create bounties, find workers, assign tasks, and pay humans.

## Architecture

```
User's Laptop
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  iknowaguy init  ──► Register tenant in Supabase            │
│       │                  Get API key + tenant_id             │
│       │                  Store in ~/.iknowaguy/config.json   │
│       ▼                                                     │
│  iknowaguy start                                             │
│       │                                                     │
│       ├── starts :3001 (Local REST API)                     │
│       │       └── reads from ~/.iknowaguy/config.json        │
│       │       └── talks to Supabase (cloud, shared)          │
│       │                                                     │
│       └── starts :3000 (MCP Server)                         │
│               └── AI agents connect via MCP                 │
│                                                             │
│  iknowaguy stop                                             │
│  iknowaguy status                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

```
iknowaguy/
  packages/
    cli/              # CLI tool (init, start, stop, status, update)
    api/              # Local REST API server (port 3001)
    mcp-server/       # MCP server (port 3000) — stdio + HTTP
    website/          # Marketing site (iknowaguy.ai) — Next.js
    shared/           # Shared types and utilities
    supabase/        # Migrations and seed data
```

## Website

**iknowaguy.ai** — Marketing site with:
- `/` — Landing page: hero, features, MCP tools list, CTA
- `/docs` — Documentation: installation, quickstart, MCP tools reference
- `/download` — Download links: curl, npm, manual

## CLI Commands

| Command | Description |
|---------|-------------|
| `iknowaguy init` | Register tenant and create config at ~/.iknowaguy/config.json |
| `iknowaguy start` | Start API (3001) and MCP server (3000) as background processes |
| `iknowaguy stop` | Stop background processes |
| `iknowaguy status` | Check if running and on which ports |
| `iknowaguy update` | Update to latest version |

## MCP Tools

| Tool | Description | Category |
|------|-------------|----------|
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

## Config File

`~/.iknowaguy/config.json`:
```json
{
  "version": "0.1.0",
  "tenant_id": "uuid",
  "api_key": "hah_xxx",
  "supabase_url": "https://xxx.supabase.co",
  "supabase_service_role_key": "eyJxxx",
  "api_port": 3001,
  "mcp_port": 3000
}
```

Permissions: `chmod 600` — contains service role key.

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
|------|------------|
| Protocol | Model Context Protocol (MCP) 2024-11-05 |
| CLI | Node.js 22+, TypeScript, Oclif |
| Server | Express + MCP SDK, TypeScript |
| Database | Supabase (PostgreSQL + Realtime + Auth + Storage) |
| Auth | Supabase Auth (web) + API keys SHA-256 (MCP) |
| Payments | Stripe (PaymentIntents + Webhooks) with stub mode fallback |
| Website | Next.js 14, React 18 |
| Package Manager | pnpm |
| Monorepo | Turborepo |

## Development

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install
pnpm build
```

## License

[MIT](LICENSE) © 2026 iknowaguy

---

<p align="center">
  Built with ❤️ for agents who need a human touch.
</p>