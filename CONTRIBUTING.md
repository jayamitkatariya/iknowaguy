# Contributing to HireAHuman

Thank you for your interest in contributing! This document will get you set up and explain our workflow.

## Development Environment Setup

### Prerequisites

- **Node.js** 20+ (we recommend using `nvm`)
- **npm** 10.9.0+ (this project uses npm, not pnpm or yarn)
- **Git**
- **Supabase** account (free tier works)
- **Redis** (optional for local dev; Docker works fine)

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/hireahuman.git
cd hireahuman
```

### 2. Install Dependencies

```bash
npm install
```

This installs root dependencies and links all workspace packages.

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials. At minimum you need:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
PORT=3001
```

### 4. Set Up the Database

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Run `supabase/migrations/001_complete.sql`
4. (Optional) Run `supabase/seed.sql` for sample data

### 5. Build Everything

```bash
npm run build
```

### 6. Start Development

```bash
# Start MCP server (port 3001)
npm run dev

# Or start individual packages
cd packages/mcp-server && npm run dev:http
cd packages/api && npm run dev
cd packages/worker-app && npm run dev
cd packages/agent-portal && npm run dev
```

### 7. Verify Setup

```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","version":"0.1.0"}
```

## Project Structure

```
hireahuman/
├── packages/
│   ├── mcp-server/       # MCP JSON-RPC server (Express)
│   ├── api/              # REST API (Hono)
│   ├── shared/           # Shared types & notification adapters
│   ├── worker-app/       # Next.js worker dashboard
│   └── agent-portal/  # Next.js agent portal
├── supabase/
│   └── migrations/       # Database schema
├── docs/                 # Documentation
├── .env.example          # Environment variable template
└── package.json          # Root workspace config
```

## Code Style

### TypeScript

- Use strict TypeScript with explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- Use `async/await` instead of raw Promises
- Avoid `any` — use `unknown` when types are truly unknown

### Zod for Validation

All tool inputs are validated with Zod. Pattern:

```typescript
import { z } from "zod";

const MyToolSchema = z.object({
  id: z.string().uuid().describe("Unique identifier"),
  count: z.number().int().positive().optional().default(10),
});

export async function handleMyTool(args: any, tenantId: string) {
  const parsed = MyToolSchema.safeParse(args);
  if (!parsed.success) {
    return { content: [{ type: "text", text: JSON.stringify({ error: parsed.error.message }) }] };
  }
  // ... implementation
}
```

### Inline Styles for UI

Both `worker-app` and `agent-portal` use **inline styles** with CSS utility classes in globals.css. Do not create custom CSS files unless absolutely necessary.

```tsx
// Good
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Submit
</button>

// Avoid
<button className="btn btn-primary">Submit</button>
```

### Naming Conventions

- Files: `kebab-case.ts`
- Functions: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Environment variables: `UPPER_SNAKE_CASE`

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** with clear, atomic commits

3. **Test locally**:
   ```bash
   npm run build
   npm run lint
   ```

4. **Update documentation** if you change behavior, add tools, or modify env vars

5. **Open a PR** against `main` with:
   - A clear title describing the change
   - A description explaining *why* the change is needed
   - Screenshots or logs for UI or behavior changes
   - Confirmation that `npm run build` passes

6. **Code review** — at least one maintainer approval is required

7. **Merge** — maintainers will squash and merge once approved

## Issue Templates

### Bug Report

When reporting a bug, please include:

- **Environment**: Node version, OS, npm version
- **Steps to reproduce** — minimal, numbered steps
- **Expected behavior**
- **Actual behavior** — include full error messages and stack traces
- **Code sample** or `curl` command that triggers the issue

### Feature Request

When requesting a feature, please include:

- **Use case** — what problem are you solving?
- **Proposed solution** — how should it work?
- **Alternatives considered**
- **Impact** — which packages or tools would be affected?

## Testing

While we are expanding test coverage, please manually verify:

- `npm run build` completes without errors
- New tools respond correctly via `curl` or MCP inspector
- Database migrations run cleanly on a fresh Supabase project
- Stripe webhooks (if touching payments) handle both success and failure cases

## Questions?

- Open a [GitHub Discussion](https://github.com/hireahuman/hireahuman/discussions) for general questions
- Join issues for bugs or feature requests
- Tag `@maintainers` in PRs if stuck

Thank you for making HireAHuman better!
