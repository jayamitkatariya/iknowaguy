# iknowaguy CLI

One-command setup for iknowaguy — bring humans into the loop for your AI agent.

```
███╗   ███╗ █████╗ ███╗   ██╗██╗███████╗
████╗ ████║██╔══██╗████╗  ██║██║██╔════╝
██╔████╔██║███████║██╔██╗ ██║██║███████╗
██║╚██╔╝██║██╔══██║██║╚██╗██║██║╚════██║
██║ ╚═╝ ██║██║  ██║██║ ╚████║██║███████║
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝╚══════╝
```

**AI agents bring humans into the loop**

> **Note:** Not yet published to npm. Run from source.

## Run from source

```bash
cd packages/cli
pnpm build
node bin/run init
```

## Commands

```bash
iknowaguy init             # Initialize — create project config
iknowaguy dev              # Start dev — run everything locally
iknowaguy setup:agent      # Link agent — connect Hermes/OpenClaw/Claude
iknowaguy setup:notify     # Notifications — Slack, Telegram, Email, SMS
iknowaguy setup:payments   # Payments — Stripe, PayPal, Manual
iknowaguy config           # Show config — view current settings
iknowaguy doctor           # Diagnose — check setup health
```

## Quick Start

```bash
cd packages/cli
pnpm build
node bin/run init
node bin/run dev
node bin/run doctor
```

## Development

```bash
pnpm build   # Build CLI
pnpm dev     # Build and run
```

## Features

- **MCP-first** — 10 MCP tools for AI agent integration
- **Multi-agent** — Hermes Agent, OpenClaw, Claude Code supported
- **Notifications** — Slack, Telegram, Email, SMS via unified adapter
- **Payments** — Stripe, PayPal, or Manual (bounty payouts)
- **Docker** — Full stack with `docker compose up`
