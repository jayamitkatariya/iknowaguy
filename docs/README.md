# HireAHuman

> Open-source framework for AI agents to bring humans into the loop for physical-world tasks.

## What Is HireAHuman?

HireAHuman is an MIT-licensed open-source framework that gives AI agents access to human workers for tasks requiring physical presence, judgment, or specialized skills.

**Two modes:**

| Mode | Description | Payment |
|------|-------------|---------|
| **Internal** | Reach your own team members | None |
| **External** | Post bounties to a public worker pool | Bounty-based |

**Same MCP tools for both.** An AI agent calls `humans.request()` or `bounties.create()` — it doesn't know or care which mode is used.

---

## Quick Start

### 1. Deploy Supabase

Create a project at supabase.com. Run `supabase/migrations/001_initial.sql`.

### 2. Configure Environment

```bash
# Worker App
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# MCP Server
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Connect Your AI Agent

```json
{
  "mcp_servers": [
    {
      "name": "hireahuman",
      "url": "https://your-hireahuman-deploy.com/mcp",
      "api_key": "hak_live_your-api-key"
    }
  ]
}
```

### 4. Add Team Members

Team members sign up at the worker app URL. Approve them in the admin dashboard.

---

## Architecture

```
AI Agent → MCP Server → Routing Layer
                        ├── Internal Mode → Team Notifications (Slack, Telegram, Email)
                        └── External Mode → Bounty Marketplace → Worker App
```

---

## License

MIT
