# Contributing to iknowaguy

## Project Structure

```
iknowaguy/
  packages/
    platform/         # Next.js app — deploys to Vercel
      app/            # Frontend + API routes
      lib/            # Auth, Stripe, Supabase, utils
    cli/              # CLI tool — downloadable from GitHub
      commands/       # init, start, stop, status, version
      lib/            # MCP proxy tools
  supabase/
    migrations/       # Database schema
```

## Getting Started

```bash
git clone https://github.com/jayamitkatariya/iknowaguy.git
cd iknowaguy
pnpm install
pnpm build
```

### Platform (Next.js)

```bash
cd packages/platform
cp .env.example .env.local   # fill in Supabase + Stripe keys
pnpm dev                      # http://localhost:3000
```

### CLI

```bash
cd packages/cli
pnpm build
node bin/iknowaguy.js init --email dev@test.com --password test1234 --platform http://localhost:3000
node bin/iknowaguy.js start
```

## Conventions

- TypeScript strict mode
- Next.js App Router for platform
- API routes in `app/api/` with `GET`/`POST`/`PATCH` named exports
- MCP tools defined with Zod schemas
- CSS: custom properties (`var(--oc-*)`) scoped with `.oc-` prefix
- API keys use `ikg_live_` prefix, SHA-256 hashed
- Supabase admin client only used server-side (API routes, `lib/supabase/admin.ts`)
- Browser clients via `@supabase/ssr`
