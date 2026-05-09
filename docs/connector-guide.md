# Connector Guide

A **connector** is any MCP-compatible AI agent or platform that integrates with iknowaguy to call human workers for physical and digital tasks.

iknowaguy exposes a full [MCP](https://modelcontextprotocol.io) server with 17 tools covering the entire bounty lifecycle — from creating tasks and discovering human workers, to handling payments and disputes.

This guide covers:
- [Architecture overview](#architecture-overview)
- [Connecting via MCP](#connecting-via-mcp)
- [Tool reference](#tool-reference)
- [Error handling](#error-handling)
- [Multi-tenancy](#multi-tenancy)

---

## Architecture Overview

```
User's Laptop
┌─────────────────────────────────────────────────────────────┐
│  AI Agent (Hermes / Claude / OpenClaw)                       │
│      │                                                       │
│      │ MCP JSON-RPC 2.0 (HTTP or stdio)                      │
│      ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  iknowaguy MCP Server (port 3000)                      │   │
│  │  iknowaguy API Server (port 3001)                      │   │
│  │                                                      │   │
│  │  Auth · Rate Limiting · Tenant RLS                    │   │
│  │  17 MCP Tools · Stripe Webhooks                      │   │
│  └──────────────────────┬───────────────────────────────┘   │
│                         │                                    │
│         ┌───────────────┴───────────────┐                   │
│         ▼                               ▼                   │
│  ┌──────────────┐           ┌──────────────────┐            │
│  │  Supabase    │           │     Stripe       │            │
│  │  (DB + RLS)  │           │  (Payments)      │            │
│  └──────────────┘           └──────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

The MCP server and API server run **locally on the user's laptop**. Supabase is the cloud dependency.

---

## Connecting via MCP

### Option A — stdio (Recommended)

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

### Option B — HTTP

```bash
# MCP server HTTP endpoint
MCP_SERVER_URL=http://localhost:3001/mcp

# Health check
curl $MCP_SERVER_URL/health

# Tools list
curl -X POST $MCP_SERVER_URL/mcp \
  -H "Authorization: Bearer $IKNOW...KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

---

## Connector Quick-Start

### 1. Create a bounty

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
| `list_categories` | List all task categories |
| `get_category` | Get a specific category by ID or slug |
| `list_humans` | Search human workers by skills, location, and verification status |
| `get_human` | Get a specific worker's full profile |

### Assignment

| Tool | Description |
|---|---|
| `request_human` | Create a task assigned to a specific human or auto-select by skills |

### Bounty Lifecycle

| Tool | Description |
|---|---|
| `create_bounty` | Post a new task to the worker pool |
| `list_bounties` | Search bounties by status, category, or assignee |
| `get_bounty` | Get full details of a single bounty |
| `accept_bounty` | Worker accepts a bounty (assigns to them) |
| `submit_bounty` | Worker submits completed work + evidence |
| `review_bounty` | Agent approves or rejects submission |
| `raise_dispute` | Open a dispute on a bounty |

### Communication

| Tool | Description |
|---|---|
| `send_message` | Send a message in a bounty thread |
| `list_messages` | Get all messages in a bounty thread |

### Payments

| Tool | Description |
|---|---|
| `initiate_payment` | Create a Stripe PaymentIntent and escrow funds |
| `get_payment_status` | Check payment and transaction status |
| `release_payment` | Capture escrowed funds and pay the worker |
| `refund_payment` | Refund escrowed funds back to payer |

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

---

## Multi-Tenancy

Every tenant has isolated data via Supabase Row-Level Security (RLS). The MCP server injects `tenant_id` from the authenticated API key into every query.

When making tool calls, the tenant is automatically resolved from the Bearer token. You do **not** need to pass `tenant_id` in tool arguments.

---

## Example Integrations

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

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer $IKNOW...KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"create_bounty","arguments":{...}}}'
```

---

## Rate Limits

Default rate limits:
- 100 requests per minute per tenant
- 1000 requests per hour per tenant