# iknowaguy — Complete Build Plan

## Vision
Local-first developer tool that gives AI agents (Hermes, Claude, Cline, OpenCode) access to human workers via MCP server running on the user's laptop.

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
│       │       └── reads from ~/.iknowaguy/config.json       │
│       │       └── talks to Supabase (cloud, shared)         │
│       │                                                     │
│       └── starts :3000 (MCP Server)                         │
│               └── AI agents connect via MCP                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Package Structure

```
iknowaguy/
  packages/
    cli/              # CLI tool: init, start, stop, status, update
    api/               # Local REST API server (port 3001)
    mcp-server/        # MCP server (port 3000) — stdio + HTTP
    website/           # Marketing site (runs locally) — Next.js 14
    shared/            # Shared types and utilities
    supabase/          # Migrations and seed data
```

## Tech Stack
- **Runtime:** Node.js 22+
- **Package Manager:** pnpm
- **Monorepo:** Turborepo
- **CLI:** TypeScript, Oclif
- **MCP Server:** Express + @modelcontextprotocol/sdk + Zod
- **Website:** Next.js 14.2.5, React 18, inline CSS (no Tailwind)
- **Database:** Supabase (cloud PostgreSQL)
- **Payments:** Stripe (stub mode fallback)

## Current State (v0.2 — Deployed)

### Completed
- [x] **packages/cli/** — Full CLI implementation with init, start, stop, status, update commands
- [x] **packages/website/** — Marketing Next.js site (runs locally, not deployed)
- [x] **packages/api/** — Local REST API server (port 3001)
- [x] **packages/mcp-server/** — MCP server with 17 tools
- [x] **scripts/install.sh** — Updated to install the full CLI
- [x] README.md updated with new architecture and installation instructions
- [x] PLAN.md updated

### Installation
```bash
curl -sL https://raw.githubusercontent.com/jayamitkatariya/iknowaguy/main/scripts/install.sh | bash
```

Or via npm:
```bash
npm install -g @iknowaguy/cli
```

Post-install:
```bash
iknowaguy init      # Register tenant
iknowaguy start     # Start API + MCP server
iknowaguy status    # Verify running
```

## MCP Tools (17 total)

| Tool | Description | Category |
|------|-------------|----------|
| `list_categories` | List all available task categories | Discovery |
| `get_category` | Get a specific category by ID or slug | Discovery |
| `list_humans` | Search available human workers | Discovery |
| `get_human` | Get full profile for a specific human worker | Discovery |
| `request_human` | Auto-assign a task to a human | Assignment |
| `create_bounty` | Create a new bounty task | Bounty |
| `list_bounties` | List bounties with filters | Bounty |
| `get_bounty` | Get full details for a single bounty | Bounty |
| `accept_bounty` | Accept a bounty and assign it | Bounty |
| `submit_bounty` | Submit completed work | Bounty |
| `review_bounty` | Approve or reject a submission | Bounty |
| `send_message` | Send a message in a bounty thread | Communication |
| `list_messages` | List all messages in a thread | Communication |
| `raise_dispute` | Raise a dispute with evidence | Resolution |
| `initiate_payment` | Create Stripe PaymentIntent | Payment |
| `get_payment_status` | Check payment status | Payment |
| `release_payment` | Capture held funds | Payment |
| `refund_payment` | Refund held funds | Payment |

## Remaining (post-launch)
- [ ] Publish @iknowaguy/cli to npm
- [ ] Live Stripe keys + real payment flow
- [ ] Redis-backed rate limiting (currently in-memory fallback)
- [ ] E2E tests, expanded test coverage

## License

[MIT](LICENSE) © 2026 iknowaguy