# iknowaguy — Local-First CLI Product

## What is this product?

iknowaguy is a **local-first developer tool** that gives AI agents (Hermes, OpenCode, Cline, Claude Desktop, etc.) access to human workers via an MCP server running on the user's own laptop.

The product is:
1. A **CLI tool** users install once → `npx @iknowaguy/cli` or `curl | bash`
2. A **website** (iknowaguy.ai) — marketing + docs + download button
3. A **Supabase backend** (already running) — shared multi-tenant DB

**No server infrastructure** — each user runs their own API + MCP locally. Supabase is the only cloud dependency.

---

## Architecture

```
User's Laptop
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  iknowaguy init  ──► Register tenant in Supabase            │
│       │                  Get API key + tenant_id             │
│       │                  Store in ~/.iknowaguy/config.json   │
│       ▼                                                     │
│  iknowaguy start                                             │
│       │                                                     │
│       ├── starts :3001 (Local REST API)                     │
│       │       └── reads from ~/.iknowaguy/config.json        │
│       │       └── talks to Supabase (cloud, shared)         │
│       │                                                     │
│       └── starts :3000 (MCP Server)                         │
│               └── AI agents connect via MCP                 │
│                                                             │
│  iknowaguy stop                                             │
│  iknowaguy status                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Structure (new)

```
iknowaguy/
  packages/
    cli/                    ← NEW: Node.js CLI tool
      src/
        index.ts            → CLI entry: init, start, stop, status
        commands/
          init.ts          → Register tenant + create config
          start.ts         → Start API + MCP server
          stop.ts          → Stop background processes
          status.ts        → Check if running
        lib/
          config.ts         → Read/write ~/.iknowaguy/config.json
          supabase.ts       → Supabase client (service role)
          installer.ts      → Self-install logic (download release)
      package.json
      tsconfig.json
      bin/
        iknowaguy.js        → bin entry point (runs dist/index.js)

    api/                    ← EXISTING (refactor to be standalone)
      src/
        index.ts           → Local API server (port 3001)
        (routes stay same)
      package.json
      tsconfig.json

    mcp-server/             ← EXISTING (already works)
      src/
        index.ts           → MCP server (stdio + http, port 3000)
        (tools stay same)
      package.json

    website/                ← NEW: Marketing Next.js site (port 4000)
      app/
        page.tsx           → Landing page
        page.tsx           → /docs page
        page.tsx           → /download page
        layout.tsx
      package.json

    shared/                 ← EXISTING
      (no changes needed)

    supabase/
      (migrations + seed - no changes)
```

---

## CLI Commands

### `iknowaguy init`
- Check if already initialized (`~/.iknowaguy/config.json`)
- If not: call `POST https://yktuluujkcldtvvbdmmf.supabase.co/auth/v1/signup` with email + password, then create tenant
- Get back: `{ api_key, tenant_id, supabase_url, supabase_service_role_key }`
- Store in `~/.iknowaguy/config.json` (chmod 600)
- Print: "You're connected! API key saved."

**Self-registration flow** (user has no account yet):
- The registration API needs to work without a prior account
- `POST /auth/register` creates a tenant + first user + API key in one call
- The CLI stores the resulting credentials locally

### `iknowaguy start`
- Read `~/.iknowaguy/config.json`
- Spawn `node dist/index.js` for API (port 3001) as background process
- Spawn `node dist/index.js --mcp` for MCP server (port 3000) as background process
- Write PID files to `~/.iknowaguy/run/` (api.pid, mcp.pid)
- Print: "iknowaguy is running on ports 3000 (MCP) and 3001 (API)"

### `iknowaguy stop`
- Read PID files from `~/.iknowaguy/run/`
- Kill processes gracefully (SIGTERM, then SIGKILL if needed)
- Remove PID files

### `iknowaguy status`
- Check if `~/.iknowaguy/run/api.pid` and `mcp.pid` are alive
- Print running status + which ports

### `iknowaguy --version`
- Print CLI version + MCP server version

---

## Config File

`~/.iknowaguy/config.json`:
```json
{
  "version": "0.1.0",
  "tenant_id": "uuid",
  "api_key": "hah_xxx",
  "supabase_url": "https://xxx.supabase.co",
  "supabase_service_role_key": "eyJxxx",
  "api_port": 3001,
  "mcp_port": 3000
}
```

Permissions: `chmod 600` — contains service role key.

---

## Website (packages/website)

**Purpose**: Marketing + documentation + download

Pages:
- `/` — Landing page: hero, features, "Get Started" CTA with install command
- `/docs` — Docs: installation, quickstart, API reference, MCP tools
- `/download` — Direct download links for macOS (brew), Linux (curl)

**Design**: Clean, developer-focused. Similar feel to Linear/Vercel docs.
**Tech**: Next.js 14, output='standalone' not needed, simple static-ish site.

**Content**:
- Hero: "Give your AI agents access to human workers"
- Install command: `curl -sL https://website-ochre-sigma-97.vercel.app/install.sh | bash`
- Or: `npx @iknowaguy/cli init`
- Docs link to MCP tools reference

---

## Existing API Changes

The current `packages/api` starts on port 3000 and has hardcoded Supabase env vars. Refactor:

1. **Accept config from file** — `--config ~/.iknowaguy/config.json` flag
2. **Read from config instead of env** — for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
3. **Keep env var fallback** — `SUPABASE_URL` env var still works if no config
4. **Port**: default 3001, configurable via `--port`

Same for `mcp-server` — read config from `~/.iknowaguy/config.json` or env vars.

---

## Installation Flow

### Option A: curl (one-liner, works on macOS + Linux)
```bash
curl -sL https://website-ochre-sigma-97.vercel.app/install.sh | bash
```
Downloads the install script from the website, runs it. The install script:
1. Creates `~/.iknowaguy/`
2. Downloads latest CLI tarball from GitHub Releases
3. Extracts to `~/.iknowaguy/cli/`
4. Symlinks `iknowaguy` to `~/.iknowaguy/cli/bin/iknowaguy.js`
5. Prints: "Installed! Run: iknowaguy init"

### Option B: npm
```bash
npm install -g @iknowaguy/cli
```

---

## MCP Server Distribution

Already done:
- GitHub Release: `jayamitkatariya/iknowaguy/releases/tag/v0.1.0`
- Tarball: `iknowaguy-mcp-server-0.1.0.tgz`
- MCP server is part of the CLI package — when user runs `iknowaguy start`, it starts the MCP server too.

---

## Self-Upgrade

`iknowaguy update`:
- GET `https://api.github.com/repos/jayamitkatariya/iknowaguy/releases/latest`
- Compare `tag_name` vs current version
- Download new tarball, replace `~/.iknowaguy/cli/`, restart services

---

## Deployment Checklist

- [ ] `packages/cli/` — new package, full CLI implementation
- [ ] `packages/website/` — new package, marketing site
- [ ] Refactor `packages/api/` to read from config file
- [ ] Refactor `packages/mcp-server/` to read from config file
- [ ] `scripts/install.sh` — update to install the full CLI (not just MCP server)
- [ ] Update README.md with new architecture
- [ ] Update PLAN.md
- [ ] Publish to GitHub Releases v0.2.0

---

## OpenCode Instructions

**Model**: `opencode-go/deepseek-v4-pro` (quality work)

**Working directory**: `~/Desktop/iknowaguy`

**Files to create**:
1. `packages/cli/` — full implementation
2. `packages/website/` — full implementation
3. Update `packages/api/` — add config file support
4. Update `packages/mcp-server/` — add config file support
5. Update `scripts/install.sh`
6. Update README.md, PLAN.md

**Do NOT rebuild working code** — only create NEW packages and modify existing ones where needed for config-file support.

**Exit criteria**:
- `packages/cli/` builds with `pnpm build:all` (11 packages total)
- `packages/website/` builds successfully
- `scripts/install.sh` installs the CLI
- README + PLAN updated