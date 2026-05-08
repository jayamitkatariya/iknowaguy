# @iknowaguy/sdk

Agent SDK for iknowaguy — Enables AI agents to interact with human workers.

> **Note:** Not yet published to npm. For now, use from source or the [MCP server](../mcp-server).

## Installation (from source)

```bash
cd packages/agent-sdk
pnpm build
```

## Usage

```typescript
import { iknowaguyClient } from '@iknowaguy/sdk';

const client = new iknowaguyClient({
  apiKey: 'your-api-key',
  baseUrl: 'http://localhost:3000'
});

// List available human workers
const humans = await client.listHumans({
  skills: ['delivery', 'photography'],
  location_city: 'New York'
});

// Create a bounty task
const bounty = await client.createBounty({
  title: 'Deliver groceries',
  description: 'Need someone to pick up groceries',
  category: 'delivery',
  location_address: '350 5th Ave, New York, NY',
  price: 50,
  price_type: 'fixed',
  currency: 'USD',
});

// Accept a bounty with a specific human
await client.acceptBounty(bounty.id, human.id);

// Complete a bounty
await client.completeBounty(bounty.id, human.id, [
  'https://example.com/photo1.jpg'
], 'Delivered in perfect condition');

// Review a completed bounty
await client.reviewBounty({
  bounty_id: bounty.id,
  decision: 'approved',
  notes: 'Great work!',
});

// Initiate payment
await client.initiatePayment(bounty.id, 50, 'USD');
```

## API Reference

### `iknowaguyClient`

#### Constructor

```typescript
new iknowaguyClient({ apiKey, baseUrl? })
```

- `apiKey` (required): Your iknowaguy API key
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
