# @iknowaguy/hermes-plugin

Native Hermes Agent integration for iknowaguy.

> **Note:** Not yet published to npm. For now, add iknowaguy directly to your Hermes MCP config.

## Usage

Add to your Hermes agent config:

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
cd packages/hermes-plugin
pnpm build
```
