# MCP Tool Reference

All tools are exposed via the **iknowaguy MCP Proxy** over MCP stdio. Connect by running `iknowaguy start`.

**Protocol:** MCP 2024-11-05  
**Connection:** stdio (via `iknowaguy start`)

---

## Table of Contents

- [Discovery](#discovery)
  - [list_categories](#list_categories)
  - [get_category](#get_category)
  - [list_humans](#list_humans)
  - [get_human](#get_human)
- [Assignment](#assignment)
  - [request_human](#request_human)
- [Bounty Management](#bounty-management)
  - [create_bounty](#create_bounty)
  - [list_bounties](#list_bounties)
  - [get_bounty](#get_bounty)
  - [accept_bounty](#accept_bounty)
  - [submit_bounty](#submit_bounty)
  - [review_bounty](#review_bounty)
- [Communication](#communication)
  - [send_message](#send_message)
  - [list_messages](#list_messages)
- [Resolution](#resolution)
  - [raise_dispute](#raise_dispute)
- [Payments](#payments)
  - [initiate_payment](#initiate_payment)
  - [get_payment_status](#get_payment_status)
  - [release_payment](#release_payment)
  - [refund_payment](#refund_payment)

---

## Discovery

### `list_categories`

List all available task categories.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `limit` | `number` | No | Max results to return (default: 50) |
| `offset` | `number` | No | Offset for pagination (default: 0) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "list_categories",
    "arguments": { "limit": 10 }
  }
}
```

**Example Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"categories\": [\n  { \"id\": \"...\", \"name\": \"Photography\", \"slug\": \"photography\" },\n  { \"id\": \"...\", \"name\": \"Inspection\", \"slug\": \"inspection\" }\n],\n\"total\": 2}"
    }]
  }
}
```

**Error Cases:**
- Database query failure → Returns `{ error: "<postgres error message>" }`

---

### `get_category`

Get a specific category by UUID or slug.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `category_id` | `string` | **Yes** | Category UUID or slug |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_category",
    "arguments": { "category_id": "photography" }
  }
}
```

**Example Response:**
```json
{
  "category": {
    "id": "a1b2c3d4-...",
    "name": "Photography",
    "slug": "photography",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

**Error Cases:**
- Category not found → `{ error: "Category not found" }`
- Invalid UUID format → Treated as slug lookup (no error)

---

### `list_humans`

Search available human workers with optional filters.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `skills` | `string[]` | No | Filter by skills (array overlap) |
| `location_city` | `string` | No | Filter by city (case-insensitive) |
| `location_country` | `string` | No | Filter by country (case-insensitive) |
| `verification_status` | `string` | No | Filter by status (default: `"verified"`) |
| `limit` | `number` | No | Number of results (default: 20) |
| `offset` | `number` | No | Offset for pagination (default: 0) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "list_humans",
    "arguments": {
      "skills": ["photography", "drone"],
      "location_city": "Austin",
      "limit": 5
    }
  }
}
```

**Example Response:**
```json
{
  "humans": [
    {
      "id": "user-uuid",
      "full_name": "Jane Doe",
      "bio": "Professional photographer",
      "skills": ["photography", "drone"],
      "location_city": "Austin",
      "location_country": "US",
      "verification_status": "verified",
      "rating": 4.9,
      "completed_tasks": 47,
      "hourly_rate": 75
    }
  ],
  "total": 1
}
```

**Error Cases:**
- Database error → `{ error: "<message>" }`

---

### `get_human`

Get full profile details for a specific human worker.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `human_id` | `string` | **Yes** | ID of the human worker (`human_profiles.id`) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "get_human",
    "arguments": { "human_id": "user-uuid" }
  }
}
```

**Example Response:**
```json
{
  "id": "user-uuid",
  "full_name": "Jane Doe",
  "avatar_url": "https://...",
  "bio": "...",
  "skills": ["photography"],
  "languages": ["en", "es"],
  "location_city": "Austin",
  "location_country": "US",
  "verification_status": "verified",
  "rating": 4.9,
  "completed_tasks": 47,
  "hourly_rate": 75,
  "email": "jane@example.com"
}
```

**Error Cases:**
- Database error → `{ error: "<message>" }`
- Human not found → Returns empty object with available fields

---

## Assignment

### `request_human`

Create an internal task bounty assigned to a specific human, or auto-select by skills. Notifies the assigned human via email.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Title of the task request |
| `description` | `string` | **Yes** | Description of the task |
| `instructions` | `string` | No | Step-by-step instructions |
| `target_human_id` | `string` | No | Specific human to request |
| `skills` | `string[]` | No | Required skills (used if `target_human_id` not provided) |
| `location_address` | `string` | No | Task location address |
| `location_lat` | `number` | No | Task latitude |
| `location_lng` | `number` | No | Task longitude |
| `reward_amount` | `number` | No | Reward amount in USD (default: 0) |
| `deadline` | `string` | No | ISO 8601 deadline |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "request_human",
    "arguments": {
      "title": "Drone roof inspection",
      "description": "Inspect roof damage after storm",
      "skills": ["drone", "inspection"],
      "reward_amount": 150,
      "deadline": "2026-05-10T17:00:00Z"
    }
  }
}
```

**Example Response:**
```json
{
  "bounty": {
    "id": "bounty-uuid",
    "title": "Drone roof inspection",
    "status": "open",
    "assigned_human_id": "user-uuid",
    "reward_amount": 150,
    "currency": "USD"
  },
  "notifications": [
    { "channel": "email", "status": "sent" }
  ],
  "message": "Task created and assigned"
}
```

**Error Cases:**
- No verified humans match criteria → `{ error: "No verified humans match the criteria" }`
- Target human user record not found → `{ error: "Target human user record not found" }`
- Bounty insert failure → `{ error: "<postgres message>" }`

---

## Bounty Management

### `create_bounty`

Create a new bounty task for human workers to accept.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `title` | `string` | **Yes** | Title of the bounty (max 200 chars) |
| `description` | `string` | **Yes** | Detailed description (max 5000 chars) |
| `instructions` | `string` | No | Step-by-step instructions |
| `category_id` | `string` | No | Category UUID |
| `template_id` | `string` | No | Template UUID |
| `location_address` | `string` | No | Street address |
| `location_lat` | `number` | No | Latitude |
| `location_lng` | `number` | No | Longitude |
| `reward_amount` | `number` | No | Reward amount in USD (default: 0) |
| `currency` | `string` | No | Currency: `USD`, `EUR`, `GBP`, `INR` (default: `USD`) |
| `deadline` | `string` | No | ISO 8601 deadline |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "create_bounty",
    "arguments": {
      "title": "Property photo shoot",
      "description": "Take 20 photos of the exterior",
      "reward_amount": 200,
      "currency": "USD",
      "deadline": "2026-05-15T12:00:00Z"
    }
  }
}
```

**Example Response:**
```json
{
  "bounty": {
    "id": "bounty-uuid",
    "title": "Property photo shoot",
    "status": "open",
    "reward_amount": 200,
    "currency": "USD",
    "created_at": "2026-05-04T10:00:00Z"
  },
  "message": "Bounty created successfully"
}
```

**Error Cases:**
- Insert failure → `{ error: "<postgres message>" }`

---

### `list_bounties`

List bounties with optional status and category filters.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `status` | `string` | No | Filter by status: `open`, `accepted`, `in_progress`, `submitted`, `reviewing`, `completed`, `disputed`, `cancelled`, `refunded` |
| `category_id` | `string` | No | Filter by category UUID |
| `assigned_human_id` | `string` | No | Filter by assigned human |
| `limit` | `number` | No | Number of results (default: 20) |
| `offset` | `number` | No | Offset for pagination (default: 0) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "list_bounties",
    "arguments": { "status": "open", "limit": 10 }
  }
}
```

**Example Response:**
```json
{
  "bounties": [
    {
      "id": "bounty-uuid",
      "title": "Property photo shoot",
      "status": "open",
      "reward_amount": 200,
      "currency": "USD"
    }
  ],
  "total": 1
}
```

**Error Cases:**
- Database error → `{ error: "<message>" }`

---

### `get_bounty`

Get a single bounty with full details.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | ID of the bounty |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "get_bounty",
    "arguments": { "id": "bounty-uuid" }
  }
}
```

**Example Response:**
```json
{
  "id": "bounty-uuid",
  "title": "Property photo shoot",
  "description": "Take 20 photos of the exterior",
  "status": "open",
  "reward_amount": 200,
  "currency": "USD",
  "location_address": "123 Main St",
  "deadline": "2026-05-15T12:00:00Z"
}
```

**Error Cases:**
- Bounty not found → `{ error: "<postgres message>" }`

---

### `accept_bounty`

Accept a bounty and assign it to a human worker. Only works if status is `open`.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | ID of the bounty to accept |
| `assigned_human_id` | `string` | **Yes** | ID of the human accepting |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "accept_bounty",
    "arguments": {
      "id": "bounty-uuid",
      "assigned_human_id": "user-uuid"
    }
  }
}
```

**Example Response:**
```json
{
  "bounty": {
    "id": "bounty-uuid",
    "status": "accepted",
    "assigned_human_id": "user-uuid"
  },
  "message": "Bounty accepted successfully"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- Bounty not open → `{ error: "Bounty cannot be accepted. Current status: <status>" }`

---

### `submit_bounty`

Submit a completed bounty with evidence (photos/notes).

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | ID of the bounty to submit |
| `content` | `string` | No | Submission notes/description (max 5000 chars) |
| `media_urls` | `string[]` | No | Array of photo/video URL strings |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 10,
  "method": "tools/call",
  "params": {
    "name": "submit_bounty",
    "arguments": {
      "id": "bounty-uuid",
      "content": "Completed all 20 exterior shots.",
      "media_urls": ["https://cdn.example.com/photo1.jpg"]
    }
  }
}
```

**Example Response:**
```json
{
  "submission": {
    "id": "submission-uuid",
    "bounty_id": "bounty-uuid",
    "status": "submitted",
    "media_urls": ["https://cdn.example.com/photo1.jpg"]
  },
  "bounty": {
    "id": "bounty-uuid",
    "status": "submitted"
  },
  "message": "Bounty submitted for review"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- No assigned human → `{ error: "Bounty has no assigned human" }`
- Invalid media URLs → `{ error: "Invalid media URLs: <url1>, <url2>" }`

---

### `review_bounty`

Approve or reject a submitted bounty.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | **Yes** | ID of the bounty to review |
| `decision` | `string` | **Yes** | `approved` or `rejected` |
| `notes` | `string` | No | Review notes (max 5000 chars) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 11,
  "method": "tools/call",
  "params": {
    "name": "review_bounty",
    "arguments": {
      "id": "bounty-uuid",
      "decision": "approved",
      "notes": "Great work on the angles!"
    }
  }
}
```

**Example Response:**
```json
{
  "bounty": {
    "id": "bounty-uuid",
    "status": "completed"
  },
  "review_decision": "approved",
  "message": "Bounty approved"
}
```

**Error Cases:**
- No submission found → `{ error: "No submission found for this bounty" }`

---

## Communication

### `send_message`

Send a message in a bounty thread.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty thread |
| `sender_id` | `string` | **Yes** | ID of the message sender |
| `content` | `string` | **Yes** | Message content (max 2000 chars) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 12,
  "method": "tools/call",
  "params": {
    "name": "send_message",
    "arguments": {
      "bounty_id": "bounty-uuid",
      "sender_id": "user-uuid",
      "content": "Can you take a few more from the north side?"
    }
  }
}
```

**Example Response:**
```json
{
  "message_id": "msg-uuid",
  "created_at": "2026-05-04T11:00:00Z"
}
```

**Error Cases:**
- Insert failure → `{ error: "<postgres message>" }`

---

### `list_messages`

List messages for a bounty thread ordered by creation time.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty thread |
| `limit` | `number` | No | Number of results (default: 50) |
| `offset` | `number` | No | Offset for pagination (default: 0) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 13,
  "method": "tools/call",
  "params": {
    "name": "list_messages",
    "arguments": {
      "bounty_id": "bounty-uuid",
      "limit": 20
    }
  }
}
```

**Example Response:**
```json
{
  "messages": [
    {
      "id": "msg-uuid",
      "bounty_id": "bounty-uuid",
      "sender_id": "user-uuid",
      "content": "Can you take a few more from the north side?",
      "created_at": "2026-05-04T11:00:00Z",
      "sender": {
        "id": "user-uuid",
        "name": "Jane Doe",
        "avatar_url": "https://..."
      }
    }
  ],
  "total": 1
}
```

**Error Cases:**
- Database error → `{ error: "<message>" }`

---

## Resolution

### `raise_dispute`

Raise a dispute on a bounty and update its status to `disputed`.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty |
| `raised_by` | `string` | **Yes** | ID of the user raising the dispute |
| `reason` | `string` | **Yes** | Reason for the dispute |
| `evidence_urls` | `string[]` | No | Evidence URLs |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 14,
  "method": "tools/call",
  "params": {
    "name": "raise_dispute",
    "arguments": {
      "bounty_id": "bounty-uuid",
      "raised_by": "user-uuid",
      "reason": "Photos do not match the requested angles",
      "evidence_urls": ["https://cdn.example.com/evidence.jpg"]
    }
  }
}
```

**Example Response:**
```json
{
  "dispute": {
    "id": "dispute-uuid",
    "bounty_id": "bounty-uuid",
    "status": "open",
    "reason": "Photos do not match the requested angles"
  },
  "message": "Dispute raised successfully. Bounty status updated to disputed."
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- Bounty already disputed → `{ error: "Bounty is already disputed" }`
- Insert/update failure → `{ error: "<postgres message>" }`

---

## Payments

### `initiate_payment`

Initiate a payment for a bounty. Creates a Stripe PaymentIntent and records it in `payment_transactions`. Updates bounty `payment_status` to `escrowed`.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty |
| `amount` | `number` | **Yes** | Payment amount (must be positive) |
| `currency` | `string` | No | `USD`, `EUR`, `GBP`, `INR` (default: `USD`) |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 15,
  "method": "tools/call",
  "params": {
    "name": "initiate_payment",
    "arguments": {
      "bounty_id": "bounty-uuid",
      "amount": 200,
      "currency": "USD"
    }
  }
}
```

**Example Response:**
```json
{
  "payment_intent_id": "pi_1234567890",
  "bounty_id": "bounty-uuid",
  "amount": 200,
  "currency": "USD",
  "status": "escrowed",
  "message": "Payment initiated successfully"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- Transaction insert failure → `{ error: "<postgres message>" }`
- Stripe API failure → Thrown as internal error (500)

---

### `get_payment_status`

Get the current payment status for a bounty.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 16,
  "method": "tools/call",
  "params": {
    "name": "get_payment_status",
    "arguments": { "bounty_id": "bounty-uuid" }
  }
}
```

**Example Response:**
```json
{
  "bounty_id": "bounty-uuid",
  "payment_status": "escrowed",
  "transaction_status": "pending",
  "stripe_status": "requires_capture",
  "amount": 200,
  "currency": "USD"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`

---

### `release_payment`

Release (capture) payment for a completed bounty.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "tools/call",
  "params": {
    "name": "release_payment",
    "arguments": { "bounty_id": "bounty-uuid" }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "bounty_id": "bounty-uuid",
  "payment_status": "released",
  "message": "Payment released successfully"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- No payment transaction → `{ error: "No payment transaction found for this bounty" }`
- Stripe capture failure → Thrown as internal error (500)

---

### `refund_payment`

Refund payment for a bounty.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `bounty_id` | `string` | **Yes** | ID of the bounty |
| `reason` | `string` | No | Reason for refund |

**Example Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 18,
  "method": "tools/call",
  "params": {
    "name": "refund_payment",
    "arguments": {
      "bounty_id": "bounty-uuid",
      "reason": "Task cancelled by requester"
    }
  }
}
```

**Example Response:**
```json
{
  "success": true,
  "bounty_id": "bounty-uuid",
  "payment_status": "refunded",
  "reason": "Task cancelled by requester",
  "message": "Payment refunded successfully"
}
```

**Error Cases:**
- Bounty not found → `{ error: "Bounty not found" }`
- No payment transaction → `{ error: "No payment transaction found for this bounty" }`
- Stripe refund failure → Thrown as internal error (500)

---

## Common Error Patterns

All tools return errors inside the MCP `content` array as JSON text:

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\": \"Bounty not found\"}"
  }]
}
```

JSON-RPC level errors (method not found, invalid params, etc.) are returned as standard JSON-RPC error objects:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32601,
    "message": "Tool not found: unknown_tool"
  }
}
```

**Standard JSON-RPC error codes:**

| Code | Meaning |
|---|---|
| `-32600` | Invalid Request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |

## Authentication

The MCP proxy authenticates via the API key stored in `~/.iknowaguy/config.json`. No manual auth required — just run `iknowaguy init` once.