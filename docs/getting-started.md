# Getting Started

## 1. Install

```bash
curl -fsSL https://iknowaguy.com/install.sh | bash
```

Or via npm:
```bash
npm install -g @iknowaguy/cli
```

## 2. Initialize

```bash
iknowaguy init --email you@example.com --password "YourPassword123"
```

Registers with the iknowaguy platform and saves config to `~/.iknowaguy/config.json`.

## 3. Start MCP Proxy

```bash
iknowaguy start
```

Starts the MCP proxy in stdio mode. Your AI agent can now connect.

## 4. Connect Your AI Agent

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

## 5. Verify

```bash
iknowaguy status
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `iknowaguy init` | Register with the platform |
| `iknowaguy start` | Start MCP proxy |
| `iknowaguy stop` | Stop MCP proxy |
| `iknowaguy status` | Check if running |
| `iknowaguy version` | Show version |

## Config

`~/.iknowaguy/config.json` (chmod 600):
```json
{
  "version": "0.1.0",
  "tenant_id": "uuid",
  "api_key": "ikg_live_...",
  "platform_url": "https://iknowaguy.com"
}
```

## Need Help?

[GitHub Issues](https://github.com/jayamitkatariya/iknowaguy/issues)
