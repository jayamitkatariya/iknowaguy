# HireAHuman CLI

One-command setup for HireAHuman — bring humans into the loop for your AI agent.

```
███╗   ███╗ █████╗ ███╗   ██╗██╗███████╗
████╗ ████║██╔══██╗████╗  ██║██║██╔════╝
██╔████╔██║███████║██╔██╗ ██║██║███████╗
██║╚██╔╝██║██╔══██║██║╚██╗██║██║╚════██║
██║ ╚═╝ ██║██║  ██║██║ ╚████║██║███████║
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝
```

**AI agents bring humans into the loop**

## Install

```bash
npm install -g hireahuman
```

## Commands

```bash
hireahuman init             #  INITIALIZE — create project config
hireahuman dev              #  START DEV — run everything locally
hireahuman setup:agent      #  LINK AGENT — connect Hermes/OpenClaw/Claude
hireahuman setup:notify     #  NOTIFICATIONS — Slack, Telegram, Email, SMS
hireahuman setup:payments   #  PAYMENTS — Stripe, PayPal, Manual
hireahuman config           #  SHOW CONFIG — view current settings
hireahuman doctor           #  DIAGNOSE — check setup health
```

## Quick Start

```bash
# 1. Initialize your project
cd my-ai-agent-project
hireahuman init

# 2. Paste the SQL in Supabase SQL Editor
# → supabase/migrations/001_complete.sql

# 3. Start everything locally
hireahuman dev

# 4. Link your AI agent
hireahuman setup:agent

# 5. Check health
hireahuman doctor
```

## Development

```bash
npm run build   # Build CLI
npm run dev     # Build and run
```

## Features

- **MCP-first** — 10 MCP tools for AI agent integration
- **Multi-agent** — Hermes Agent, OpenClaw, Claude Code supported
- **Notifications** — Slack, Telegram, Email, SMS via unified adapter
- **Payments** — Stripe, PayPal, or Manual (bounty payouts)
- **Docker** — Full stack with `docker compose up`
