# iknowaguy — Local-First CLI Product

## What is this product?

iknowaguy is a **local-first developer tool** that gives AI agents (Hermes, OpenCode, Cline, Claude Desktop, etc.) access to human workers via an MCP server running on the user's own laptop.

The product is:
1. A **CLI tool** users install once → `npx @iknowaguy/cli` or `curl | bash`
2. **Local servers** (API on port 3001, MCP on port 3000) that run on the user's laptop
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
│       └── starts :3000 (MCP Server)                          │
│               └── AI agents connect via MCP                 │
│                                                             │
│  iknowaguy stop                                             │
│  iknowaguy status                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Structure

```
iknowaguy/
  packages/
    cli/                    ← Node.js CLI tool
      src/
        index.ts            → CLI entry: init, start, stop, status
        commands/
          init.ts           → Register tenant + create config
          start.ts          → Start API + MCP server
          stop.ts           → Stop background processes
          status.ts         → Check if running
        lib/
          config.ts         → Read/write ~/.iknowaguy/config.json
          supabase.ts       → Supabase client (service role)
          installer.ts      → Self-install logic (download release)
      package.json
      tsconfig.json
      bin/
        iknowaguy.js        → bin entry point (runs dist/index.js)

    api/                    ← Local REST API server
      src/
        index.ts           → Local API server (port 3001)
      package.json

    mcp-server/             ← MCP server
      src/
        index.ts           → MCP server (stdio + http, port 3000)
      package.json

    website/                 ← Marketing site (runs locally, not deployed)
      app/
        page.tsx           → Landing page
        docs/page.tsx      → /docs page
        download/page.tsx  → /download page
      package.json

    shared/                 ← Shared types and utilities

    supabase/
      (migrations + seed)
```

---

## CLI Commands

### `iknowaguy init`
- Check if already initialized (`~/.iknowaguy/config.json`)
- If not: call Supabase to register tenant
- Get back: `{ api_key, tenant_id, supabase_url, supabase_service_role_key }`
- Store in `~/.iknowaguy/config.json` (chmod 600)
- Print: "You're connected! API key saved."

### `iknowaguy start`
- Read `~/.iknowaguy/config.json`
- Spawn API server (port 3001) as background process
- Spawn MCP server (port 3000) as background process
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

## Installation Flow

### Option A: curl (one-liner, works on macOS + Linux)
```bash
curl -sL https://raw.githubusercontent.com/jayamitkatariya/iknowaguy/main/scripts/install.sh | bash
```

The install script:
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

## Self-Upgrade

`iknowaguy update`:
- GET `https://api.github.com/repos/jayamitkatariya/iknowaguy/releases/latest`
- Compare `tag_name` vs current version
- Download new tarball, replace `~/.iknowaguy/cli/`, restart services

---

## MCP Server Distribution

The MCP server is part of the CLI package — when user runs `iknowaguy start`, it starts the MCP server too.

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

**Do NOT rebuild working code** — only create NEW packages and modify existing ones where needed for config-file support.

**Exit criteria**:
- `packages/cli/` builds with `pnpm build:all` (11 packages total)
- `packages/website/` builds successfully
- `scripts/install.sh` installs the CLI