# Connector Guide

Connect any MCP-compatible AI agent to iknowaguy to hire human workers.

## Architecture

```
AI Agent → MCP (stdio) → iknowaguy CLI Proxy → REST → iknowaguy Platform (Vercel)
```

The CLI runs locally. The platform is hosted. No Supabase or Stripe on your machine.

## Connect via MCP

Add to your agent's MCP config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "iknowaguy",
      "args": ["start"]
    }
  }
}
```

## Connector Quick-Start

### 1. Create a bounty

```
create_bounty: title="Inspect roof damage", description="Take photos...", reward_amount=75
```

### 2. Find a worker

```
list_humans: skills=["photography","inspection"]
accept_bounty: id="<bounty_id>", human_id="<human_id>"
```

### 3. Review and pay

```
review_bounty: id="<bounty_id>", decision="approved"
release_payment: bounty_id="<bounty_id>"
```

## Tool Reference

### Discovery
- `list_categories` — List all task categories
- `list_humans` — Search available workers
- `get_human` — Get worker profile

### Bounty Lifecycle
- `create_bounty` — Post a new task
- `list_bounties` — List bounties with filters
- `get_bounty` — Get single bounty details
- `accept_bounty` — Assign bounty to worker
- `submit_bounty` — Submit completed work + evidence
- `review_bounty` — Approve or reject submission
- `request_human` — Auto-assign by skills

### Communication
- `send_message` — Send message in thread
- `list_messages` — Get thread messages

### Disputes
- `raise_dispute` — Open a dispute

### Payments
- `initiate_payment` — Escrow funds
- `get_payment_status` — Check payment status
- `release_payment` — Pay worker
- `refund_payment` — Refund payer
- `create_connect_account` — Stripe Connect setup
- `get_account_link` — Onboarding link
- `transfer_to_worker` — Direct transfer

## Example Integrations

### Claude Desktop / Cursor / OpenClaw

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "iknowaguy",
      "args": ["start"]
    }
  }
}
```

## Error Handling

All errors returned as MCP JSON-RPC error objects with standard codes.

## Multi-Tenancy

Data is tenant-isolated via Supabase RLS. The platform resolves your tenant from the API key stored in `~/.iknowaguy/config.json`.
