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

## Installation

### Option A: curl (macOS + Linux)

```bash
curl -sL https://raw.githubusercontent.com/jayamitkatariya/iknowaguy/main/scripts/install.sh | bash
```

### Option B: npm

```bash
npm install -g @iknowaguy/cli
```

## Quick Start

```bash
iknowaguy init      # Register tenant + create config at ~/.iknowaguy/config.json
iknowaguy start     # Start API (port 3001) + MCP server (port 3000)
iknowaguy status    # Verify running
```

## Commands

| Command | Description |
|---------|-------------|
| `iknowaguy init` | Register tenant and create config |
| `iknowaguy start` | Start API (3001) and MCP server (3000) |
| `iknowaguy stop` | Stop background processes |
| `iknowaguy status` | Check if running and on which ports |
| `iknowaguy update` | Update to latest version |

## Architecture

The CLI starts two local servers:
- **API server** on port 3001 — REST API for the MCP server and direct access
- **MCP server** on port 3000 — AI agents connect via MCP protocol

Both servers read configuration from `~/.iknowaguy/config.json`.

## Development

```bash
cd packages/cli
pnpm install
pnpm build
node bin/run init
node bin/run start
```

## Features

- **MCP-first** — 17 MCP tools for AI agent integration
- **Local-first** — servers run on your laptop, Supabase is the only cloud dependency
- **Multi-agent** — Hermes Agent, OpenClaw, Claude Desktop, Cursor supported
- **Payments** — Stripe integration with escrow flow
- **Docker** — Run locally with `docker compose up` (coming soon)