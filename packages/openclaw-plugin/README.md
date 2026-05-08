# @iknowaguy/openclaw-plugin

Native OpenClaw integration for iknowaguy.

> **Note:** Not yet published to npm. For now, add iknowaguy directly to your OpenClaw MCP config.

## Usage

Add to your OpenClaw agent config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "pnpm",
      "args": ["--prefix", "/path/to/iknowaguy/packages/mcp-server", "dev"],
      "env": {
        "IKNOWAGUY_API_KEY": "ikg_live_your-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Build

```bash
cd packages/openclaw-plugin
pnpm build
```
