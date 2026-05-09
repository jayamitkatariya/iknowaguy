# Getting Started

## Prerequisites

- Node.js 20+
- pnpm 10+

## Step 1: Install iknowaguy

```bash
curl -sL https://raw.githubusercontent.com/jayamitkatariya/iknowaguy/main/scripts/install.sh | bash
```

Or via npm:
```bash
npm install -g @iknowaguy/cli
```

## Step 2: Initialize

```bash
iknowaguy init
```

This registers your tenant with Supabase and saves config to `~/.iknowaguy/config.json`.

## Step 3: Start

```bash
iknowaguy start
```

This starts:
- **API server** on port 3001 (local REST API)
- **MCP server** on port 3000 (for AI agents to connect)

## Step 4: Connect Your AI Agent

Add iknowaguy to your agent's MCP config:

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

## Step 5: Verify Status

```bash
iknowaguy status
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `iknowaguy init` | Register tenant + create config |
| `iknowaguy start` | Start API (3001) and MCP (3000) servers |
| `iknowaguy stop` | Stop background servers |
| `iknowaguy status` | Check if running |
| `iknowaguy update` | Update to latest version |

## Config Location

Config is stored at `~/.iknowaguy/config.json`. The MCP server and API read from this file.

## MCP Server URL

- **HTTP:** `http://localhost:3001/mcp`
- **Stdio:** `npx -y @iknowaguy/mcp-server --stdio`

## Need Help?

Open a [GitHub Issue](https://github.com/jayamitkatariya/iknowaguy/issues).