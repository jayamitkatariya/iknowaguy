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

### 3. Configure

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials.

### 4. Database

1. Create a project at [supabase.com](https://supabase.com)
2. Open SQL Editor
3. Run `supabase/migrations/001_complete.sql`
4. (Optional) Run `supabase/seed.sql` for sample data

### 5. Build All Packages

```bash
pnpm build:all
```

### 6. Start Development

```bash
# Start MCP server (port 3001)
cd packages/mcp-server && pnpm dev

# Start website (port 3002)
cd packages/worker-app && pnpm dev
```

## Project Structure

```
packages/
├── mcp-server/      # MCP JSON-RPC server (Express). Core product.
├── shared/          # Shared types, utils, pricing, notifications
├── worker-app/      # Next.js 14 — website (landing + worker marketplace + agent dashboard)
├── api/             # REST API (Hono) — legacy, not deployed
├── cli/             # iknowaguy CLI
├── agent-sdk/       # TypeScript SDK for agent developers
├── hermes-plugin/   # Hermes Agent integration plugin
├── openclaw-plugin/ # OpenClaw integration plugin
└── langchain-sdk/   # LangChain toolkit integration
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
3. Verify: `pnpm build:all`
4. Update docs if needed
5. Open PR with description explaining *why*

## Testing

Currently expanding test coverage. At minimum:

- `pnpm build:all` must pass without errors
- MCP tools tested manually via `curl`
- Database migrations run cleanly

## Questions?

- Open a [GitHub Issue](https://github.com/jayamitkatariya/iknowaguy/issues)
