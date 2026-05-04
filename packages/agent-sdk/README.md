# @hireahuman/sdk

Agent SDK for HireAHuman - Enables AI agents to interact with human workers without native MCP support.

## Installation

```bash
npm install @hireahuman/sdk
```

## Usage

```typescript
import { HireAHumanClient } from '@hireahuman/sdk';

// Initialize the client
const client = new HireAHumanClient({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:3000' // Optional, defaults to http://localhost:3000
});

// List available human workers
const humans = await client.listHumans({
  skills: ['delivery', 'photography'],
  location_city: 'New York'
});

// Create a bounty task
const bounty = await client.createBounty({
  title: 'Deliver groceries',
  description: 'Need someone to pick up groceries from Whole Foods and deliver to my office',
  category: 'delivery',
  location_city: 'New York',
  location_address: '350 5th Ave, New York, NY',
  price: 50,
  price_type: 'fixed',
  currency: 'USD',
  tenant_id: 'your-tenant-id'
});

// Accept a bounty with a specific human
await client.acceptBounty(bounty.id, human.id);

// Complete a bounty
await client.completeBounty(bounty.id, human.id, [
  'https://example.com/photo1.jpg',
  'https://example.com/receipt.pdf'
], 'Delivered in perfect condition');

// Review a completed bounty
await client.reviewBounty({
  bounty_id: bounty.id,
  decision: 'approved',
  notes: 'Great work!',
  reviewer_id: 'agent-or-admin-user-id'
});

// Send a message in the bounty thread
await client.sendMessage(bounty.id, senderId, 'Please confirm delivery');

// Create a dispute if needed
await client.createDispute({
  bounty_id: bounty.id,
  raised_by: userId,
  reason: 'Item was damaged',
  evidence_urls: ['https://example.com/damage-photo.jpg']
});

// Initiate payment
await client.initiatePayment(bounty.id, 50, 'USD');
```

## API Reference

### `HireAHumanClient`

#### Constructor

```typescript
new HireAHumanClient({ apiKey, baseUrl? })
```

- `apiKey` (required): Your HireAHuman API key
- `baseUrl` (optional): Base URL for the API. Defaults to `http://localhost:3000`

#### Methods

##### Humans

- `listHumans(filters?)` - List available human workers
- `getHuman(humanId)` - Get a specific human worker's profile

##### Bounties

- `createBounty(params)` - Create a new bounty task
- `listBounties(filters)` - List bounties for a tenant
- `acceptBounty(bountyId, humanId)` - Accept a bounty with a human worker
- `completeBounty(bountyId, submittedBy, evidence?, notes?)` - Mark a bounty as completed
- `reviewBounty(params)` - Review a completed bounty submission

##### Messages

- `sendMessage(bountyId, senderId, content)` - Send a message in a bounty thread

##### Disputes

- `createDispute(params)` - Raise a dispute on a bounty

##### Payments

- `initiatePayment(bountyId, amount, currency?)` - Initiate payment for a bounty

## TypeScript

This SDK is written in TypeScript and includes type definitions out of the box.

## License

MIT
