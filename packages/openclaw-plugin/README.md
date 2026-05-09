# @iknowaguy/openclaw-plugin

Native OpenClaw integration for iknowaguy.

## Installation

```bash
npm install @iknowaguy/openclaw-plugin
```

## Usage

Add to your OpenClaw agent config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["-y", "@iknowaguy/mcp-server", "--stdio"],
      "env": {
        "IKNOWAGUY_API_KEY": "ikg_live_your-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Requirements

- iknowaguy MCP server running (`iknowaguy start`)
- Valid Supabase project credentials

## Build

```bash
cd packages/openclaw-plugin
pnpm build
```

## License

MIT