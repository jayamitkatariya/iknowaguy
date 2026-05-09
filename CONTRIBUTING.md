# Contributing to iknowaguy

## Development Setup

### Prerequisites

- **Node.js** 20+
- **pnpm** 10+ (this project uses pnpm, not npm or yarn)
- **Git**
- **Supabase** account (free tier works)

### 1. Clone

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
```

### 2. Install

```bash
pnpm install
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Start Development

```bash
iknowaguy init      # Register tenant + create config
iknowaguy start     # Start API (3001) + MCP server (3000)
```

Or run individually:

```bash
# Start API server (port 3001)
cd packages/api && pnpm dev

# Start MCP server (port 3000)
cd packages/mcp-server && pnpm dev

# Start marketing website (port 3002)
cd packages/website && pnpm dev
```

## Project Structure

```
packages/
├── cli/              # iknowaguy CLI (init, start, stop, status, update)
├── api/              # Local REST API server (port 3001)
├── mcp-server/       # MCP JSON-RPC server (port 3000) — core product
├── shared/           # Shared types, utils, pricing
├── website/          # Marketing Next.js site (runs locally)
├── agent-sdk/        # TypeScript SDK for agent developers
├── hermes-plugin/    # Hermes Agent integration plugin
├── openclaw-plugin/  # OpenClaw integration plugin
└── langchain-sdk/    # LangChain toolkit integration
```

## Code Style

### TypeScript

- Use strict TypeScript
- Prefer `interface` over `type` for object shapes
- Use `async/await`

### Zod Validation

```typescript
const Schema = z.object({
  id: z.string().uuid(),
  count: z.number().int().positive().optional().default(10),
});

export async function handleTool(args: any, tenantId: string) {
  const parsed = Schema.safeParse(args);
  if (!parsed.success) {
    return { content: [{ type: "text", text: JSON.stringify({ error: parsed.error.message }) }] };
  }
  // ... implementation
}
```

### UI Styling

The website uses **inline styles** with CSS utility classes in `globals.css`. No Tailwind, no custom CSS files.

```tsx
// Good
<button className="oc-btn oc-btn-primary">Submit</button>

// Avoid
<button className="btn btn-primary">Submit</button>
```

### Naming

- Files: `kebab-case.ts`
- Functions: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`

## PR Process

1. Create a branch from `main`
2. Make changes with clear commits
3. Verify: `pnpm build`
4. Update docs if needed
5. Open PR with description explaining *why*

## Testing

Currently expanding test coverage. At minimum:

- `pnpm build` must pass without errors
- MCP tools tested manually via `curl`
- Database migrations run cleanly

## Questions?

Open a [GitHub Issue](https://github.com/jayamitkatariya/iknowaguy/issues)