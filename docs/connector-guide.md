# Connector Guide

A **connector** is any MCP-compatible AI agent or platform that integrates with iknowaguy to call human workers for physical and digital tasks.

iknowaguy exposes a full [MCP](https://modelcontextprotocol.io) server with 17 tools covering the entire bounty lifecycle — from creating tasks and discovering human workers, to handling payments and disputes.

This guide covers:

- [Architecture overview](#architecture-overview)
- [Connecting via MCP](#connecting-via-mcp)
- [Connector quick-start](#connector-quick-start)
- [Tool reference](#tool-reference)
- [Realtime events (SSE)](#realtime-events-sse)
- [Error handling](#error-handling)
- [Multi-tenancy](#multi-tenancy)
- [Example integrations](#example-integrations)

---

## Architecture Overview

```
┌─────────────────┐
│   Your Agent    │  ← MCP Client (Claude, Cursor, Hermes, etc.)
└────────┬────────┘
         │  MCP JSON-RPC 2.0 (HTTP POST or stdio)
         ▼
┌─────────────────────────────────────┐
│   iknowaguy MCP Server (port 3001)  │
│                                      │
│  Auth · Rate Limiting · Tenant RLS  │
│  17 MCP Tools · Stripe Webhooks     │
│  SSE /events (realtime)             │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴──────────┐
         ▼                    ▼
┌──────────────┐    ┌──────────────────┐
│  Supabase    │    │     Stripe       │
│  (DB + RLS)  │    │  (Payments)      │
└──────────────┘    └──────────────────┘
```

The MCP server handles:

| Concern | Implementation |
|---|---|
| Protocol | MCP 2024-11-05 (JSON-RPC 2.0) |
| Auth | Bearer token (`Authorization: Bearer <key>`) |
| Multi-tenancy | Tenant ID injected via RLS policies |
| Rate limiting | Redis-backed sliding window |
| Realtime | Server-Sent Events (SSE) at `GET /events` |
| Payments | Stripe PaymentIntents + webhooks |

---

## Connecting via MCP

### Option A — HTTP (Recommended for cloud agents)

```bash
# Base URL
MCP_SERVER_URL=https://your-mcp-server.com

# Health check
curl $MCP_SERVER_URL/health

# Tools list
curl -X POST $MCP_SERVER_URL/mcp \
  -H "Authorization: Bearer $IKNOWAGUY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Option B — stdio (Recommended for local/CI agents)

```json
// claude_desktop_config.json (or your agent's MCP config)
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

### Option C — Docker

```bash
docker run -p 3001:3001 \
  -e SUPABASE_URL=https://your-project.supabase.co \
  -e SUPABASE_SERVICE_ROLE_KEY=your-key \
  -e IKNOWAGUY_API_KEY=ikg_live_xxx \
  iknowaguy/mcp-server
```

---

## Connector Quick-Start

### 1. Create a bounty

When your agent needs a human to do something:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_bounty",
    "arguments": {
      "title": "Inspect roof damage after storm",
      "description": "Take photos of the roof at 123 Main St, Austin TX. Check for missing shingles, water damage, or structural issues.",
      "instructions": "1. Set ladder safely. 2. Walk roof perimeter. 3. Take 5 photos from each side. 4. Note any damage in detail.",
      "category_id": "roof-inspection",
      "location_address": "123 Main St, Austin, TX 78701",
      "reward_amount": 75.00,
      "currency": "USD",
      "deadline": "2026-06-01T18:00:00Z"
    }
  }
}
```

### 2. Wait for a human to accept

Subscribe to realtime events (see [Realtime Events](#realtime-events-sse)) or poll:

```json
{
  "method": "tools/call",
  "params": {
    "name": "get_bounty",
    "arguments": { "id": "<bounty_id>" }
  }
}
```

### 3. Review the completed work

```json
{
  "method": "tools/call",
  "params": {
    "name": "review_bounty",
    "arguments": {
      "id": "<bounty_id>",
      "decision": "approved",
      "notes": "Photos clearly show the damage. Well documented."
    }
  }
}
```

### 4. Release payment

```json
{
  "method": "tools/call",
  "params": {
    "name": "release_payment",
    "arguments": { "bounty_id": "<bounty_id>" }
  }
}
```

---

## Tool Reference

### Discovery

| Tool | Description |
|---|---|
| `list_categories` | List all task categories (photography, delivery, inspection, etc.) |
| `get_category` | Get a specific category by ID or slug |
| `list_humans` | Search human workers by skills, location, and verification status |
| `get_human` | Get a specific worker's full profile |

### Bounty Lifecycle

| Tool | Description | Events Emitted |
|---|---|---|
| `create_bounty` | Post a new task to the worker pool | `bounty.created` |
| `list_bounties` | Search bounties by status, category, or assignee | — |
| `get_bounty` | Get full details of a single bounty | — |
| `accept_bounty` | Worker accepts a bounty (assigns to them) | `bounty.accepted` |
| `submit_bounty` | Worker submits completed work + evidence | `bounty.submitted` |
| `review_bounty` | Agent approves or rejects submission | `bounty.approved`, `bounty.rejected` |
| `raise_dispute` | Open a dispute on a bounty | `bounty.disputed` |

### Communication

| Tool | Description |
|---|---|
| `send_message` | Send a message in a bounty thread |
| `list_messages` | Get all messages in a bounty thread |

### Payments

| Tool | Description | Events Emitted |
|---|---|---|
| `initiate_payment` | Create a Stripe PaymentIntent and escrow funds | — |
| `get_payment_status` | Check payment and transaction status | — |
| `release_payment` | Capture escrowed funds and pay the worker | — |
| `refund_payment` | Refund escrowed funds back to payer | `bounty.refunded` |

---

## Realtime Events (SSE)

Connect to `GET /events` to receive live bounty state-change notifications as [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events).

### Connecting

```javascript
// All events (global connector)
const es = new EventSource("http://localhost:3001/events");

// Tenant-filtered (multi-tenant connectors)
const es = new EventSource("http://localhost:3001/events?tenant_id=tenant_abc123");

// Listen for specific events
es.addEventListener("bounty.created", (e) => {
  const { type, timestamp, data } = JSON.parse(e.data);
  console.log(`[${timestamp}] ${type}:`, data);
  // {
  //   "type": "bounty.created",
  //   "timestamp": "2026-06-01T12:00:00.000Z",
  //   "tenant_id": "tenant_abc123",
  //   "data": {
  //     "bounty_id": "bty_abc123",
  //     "title": "Inspect roof damage",
  //     "status": "open",
  //     "reward_amount": 75.00
  //   }
  // }
});

es.addEventListener("bounty.accepted", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("Human accepted:", data.assigned_human_id);
});

es.addEventListener("bounty.submitted", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("Work submitted for bounty:", data.bounty_id);
});

es.addEventListener("bounty.approved", (e) => {
  const { data } = JSON.parse(e.data);
  console.log("Approved! Release payment for:", data.bounty_id);
});

es.addEventListener("bounty.rejected", (e) => {
  const { data } = JSON.parse(e.data);
  // Worker was rejected — consider re-assigning or adjusting
});

es.addEventListener("bounty.disputed", (e) => {
  const { data } = JSON.parse(e.data);
  // Human or agent raised a dispute — review evidence
});

es.addEventListener("bounty.refunded", (e) => {
  const { data } = JSON.parse(e.data);
  // Payment was refunded — funds returned to payer
});

es.addEventListener("bounty.cancelled", (e) => {
  const { data } = JSON.parse(e.data);
  // Bounty was cancelled (e.g. payment failed)
});

// Error handling
es.onerror = (err) => {
  console.error("SSE connection error:", err);
};
```

### Event Format

Every event follows this envelope:

```typescript
interface BountyEvent {
  type: BountyEventType;       // e.g. "bounty.created"
  timestamp: string;            // ISO 8601
  tenant_id: string;            // Tenant that owns this bounty
  data: Record<string, any>;    // Event-specific payload
}

type BountyEventType =
  | "bounty.created"
  | "bounty.accepted"
  | "bounty.submitted"
  | "bounty.approved"
  | "bounty.rejected"
  | "bounty.disputed"
  | "bounty.cancelled"
  | "bounty.refunded";
```

### Event → Action Matrix

| Event | Typical Connector Response |
|---|---|
| `bounty.created` | Log, update UI, notify matching humans |
| `bounty.accepted` | Update tracking, notify agent |
| `bounty.submitted` | Trigger review flow, notify reviewer |
| `bounty.approved` | Call `release_payment`, close task |
| `bounty.rejected` | Call `submit_bounty` with revision notes, or re-assign |
| `bounty.disputed` | Pause payment, open resolution flow |
| `bounty.cancelled` | Handle failure (retry/re-assign) |
| `bounty.refunded` | Log, notify payer |

---

## Error Handling

All MCP responses follow [JSON-RPC 2.0 error format](https://www.jsonrpc.org/specification#error_object):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32602,
    "message": "Invalid params: title: Required"
  }
}
```

### Error Codes

| Code | Meaning |
|---|---|
| `-32600` | Invalid Request (malformed JSON-RPC) |
| `-32601` | Method not found / Tool not found |
| `-32602` | Invalid params (validation failure) |
| `-32603` | Internal error |
| `401` | Unauthorized (invalid/missing API key) |
| `429` | Rate limit exceeded |

### Retry Strategy

```javascript
async function callTool(name, args, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(MCP_SERVER_URL + "/mcp", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.IKNOWAGUY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: crypto.randomUUID(),
        method: "tools/call",
        params: { name, arguments: args }
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data.result;
    }

    if (res.status === 429 && i < retries - 1) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // exponential backoff
      continue;
    }

    throw new Error(`HTTP ${res.status}`);
  }
}
```

---

## Multi-Tenancy

Every tenant has isolated data via Supabase Row-Level Security (RLS). The MCP server injects `tenant_id` from the authenticated API key into every query.

When making tool calls, the tenant is automatically resolved from the Bearer token. You do **not** need to pass `tenant_id` in tool arguments.

For SSE connections, filter by `tenant_id` to only receive events for your tenant:

```javascript
const es = new EventSource(`${MCP_SERVER_URL}/events?tenant_id=${MY_TENANT_ID}`);
```

---

## Example Integrations

### Agent with Human Backup (Concept)

```python
# Pseudocode: agent decides it needs a human
def agent_task(photo_url: str) -> str:
    analysis = vision_model.analyze(photo_url)

    if analysis.confidence < 0.7:
        # Too uncertain — hire a human for on-site inspection
        bounty = call_tool("create_bounty", {
            "title": "Verify damage on site",
            "description": f"AI detected {analysis.findings} at this location. Need human verification.",
            "instructions": "1. Visit location. 2. Take photos. 3. Confirm or deny AI findings.",
            "reward_amount": 50.00,
            "deadline": "2026-06-02T00:00:00Z"
        })

        # Wait for result via SSE
        bounty_id = bounty.result.content[0].text.bounty.id

        # Listen for completion
        return wait_for_bounty_complete(bounty_id)

    return analysis.report
```

### Claude Desktop

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["-y", "@iknowaguy/mcp-server"],
      "env": {
        "IKNOWAGUY_API_KEY": "ikg_live_your-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Hermes Agent

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

Or with stdio:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["@iknowaguy/mcp-server", "--stdio"],
      "env": {
        "IKNOWAGUY_API_KEY": "ikg_live_your-key",
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Direct MCP / curl

For agents that speak MCP JSON-RPC directly:

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $IKNOWAGUY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_bounty","arguments":{...}}}'
```

---

## Rate Limits

The MCP server uses a sliding window rate limiter with Redis (falling back to in-memory for local dev):

| Limit | Value |
|---|---|
| Requests per minute | 100 |
| Window | 60 seconds |

Rate limit headers returned on every response:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1717245600
```

---

## SDK Reference

For the full MCP tool reference, see [mcp-tool-reference.md](./mcp-tool-reference.md).
