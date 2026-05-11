# iknowaguy CLI

One-command setup — give your AI agents access to human workers via MCP.

## Installation

```bash
curl -fsSL https://iknowaguy.com/install.sh | bash
```
or
```bash
npm install -g @iknowaguy/cli
```

## Quick Start

```bash
iknowaguy init --email you@example.com --password "YourPassword123"
iknowaguy start
```

Your AI agent now has 21 MCP tools to create bounties, find workers, assign tasks, and pay humans.

## Commands

| Command | Description |
|---------|-------------|
| `iknowaguy init --email <e> --password <p>` | Register with the iknowaguy platform |
| `iknowaguy start` | Start the MCP proxy (stdio mode) |
| `iknowaguy stop` | Stop the MCP proxy |
| `iknowaguy status` | Check if MCP proxy is running |
| `iknowaguy version` | Show version info |

## Architecture

The CLI is a thin MCP proxy:
- Runs locally on your machine in stdio mode
- Exposes 21 MCP tools to AI agents (Claude, Cursor, OpenClaw)
- Proxies all calls to the hosted iknowaguy platform via REST API
- Config stored at `~/.iknowaguy/config.json`

No Supabase connection. No Stripe. No Express. Just MCP → REST bridge.

## Config File

`~/.iknowaguy/config.json` (chmod 600):
```json
{
  "version": "0.1.0",
  "tenant_id": "uuid",
  "api_key": "ikg_live_...",
  "platform_url": "https://iknowaguy.com"
}
```

## MCP Integration

Add to your AI agent's config:
```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "iknowaguy",
      "args": ["start"]
    }
  }
}
```

## Development

```bash
cd packages/cli
pnpm install
pnpm build
node bin/iknowaguy.js init --email dev@test.com --password test1234 --platform http://localhost:3000
node bin/iknowaguy.js start
```
