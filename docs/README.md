# iknowaguy

> Open-source MCP-first platform for AI agents to bring humans into the loop.

## What Is It?

iknowaguy is a **local-first developer tool** that gives AI agents access to human workers for tasks requiring physical presence, judgment, or specialized skills. The MCP server runs on your laptop.

## Architecture

```
AI Agent (Hermes / Claude / OpenClaw)
    │
    │ MCP protocol (local, stdio or HTTP)
    ▼
MCP Server (runs on your laptop, port 3000)
    │
    │ Direct Supabase connection (service role)
    ▼
Supabase (PostgreSQL + Auth + Storage + Realtime)  ← cloud
```

All data is tenant-isolated via Supabase Row-Level Security.

## Quick Start

### Install

```bash
curl -sL https://raw.githubusercontent.com/jayamitkatariya/iknowaguy/main/scripts/install.sh | bash
```

Or via npm:
```bash
npm install -g @iknowaguy/cli
```

### Initialize and start

```bash
iknowaguy init      # Register tenant + create config at ~/.iknowaguy/config.json
iknowaguy start     # Start API (port 3001) + MCP server (port 3000)
```

### Connect your agent

Add to your agent's MCP config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["-y", "@iknowaguy/mcp-server"],
      "env": {
        "IKNOWAGUY_API_KEY": "your-api-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## MCP Tools

17 tools covering the full bounty lifecycle:

- **Discovery:** `list_categories`, `get_category`, `list_humans`, `get_human`
- **Bounty:** `create_bounty`, `list_bounties`, `get_bounty`, `accept_bounty`, `submit_bounty`, `review_bounty`
- **Communication:** `send_message`, `list_messages`
- **Resolution:** `raise_dispute`
- **Payment:** `initiate_payment`, `get_payment_status`, `release_payment`, `refund_payment`

## Development

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install
pnpm build
```

## License

MIT