# @hireahuman/langchain-sdk

A LangChain SDK integration for building AI agents with human-in-the-loop capabilities.

## Installation

```bash
npm install @hireahuman/langchain-sdk
# or
pnpm add @hireahuman/langchain-sdk
# or
yarn add @hireahuman/langchain-sdk
```

## Usage

```typescript
import { HireAHumanChain, createChain } from '@hireahuman/langchain-sdk';

// Create a chain instance
const chain = new HireAHumanChain({
  apiKey: 'your-api-key',
  model: 'gpt-4',
  temperature: 0.7,
});

// Or use the factory function
const chain2 = createChain({
  apiKey: 'your-api-key',
});

// Process a task with human-in-the-loop support
const response = await chain.invoke({
  task: 'Review this image for policy compliance',
  context: { imageUrl: 'https://...' },
  humanFallback: true,
});

// Process with explicit human review
const reviewed = await chain.processWithHuman({
  task: 'Handle this customer dispute',
  context: { ticketId: '12345' },
});

// Stream responses
for await (const chunk of chain.stream({ task: 'Explain this code' })) {
  process.stdout.write(chunk);
}
```

## API

### HireAHumanChain

#### Constructor

```typescript
new HireAHumanChain(config?: LangChainSDKConfig)
```

##### LangChainSDKConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `apiKey` | `string` | Your API key for authentication | - |
| `endpoint` | `string` | API endpoint URL | - |
| `model` | `string` | LLM model to use | `gpt-4` |
| `temperature` | `number` | Sampling temperature | `0.7` |

#### Methods

##### `invoke(input: HumanInTheLoopInput): Promise<ChainResponse>`

Process a task with human-in-the-loop support built-in.

##### `processWithHuman(input: HumanInTheLoopInput): Promise<ChainResponse>`

Explicitly route a task for human review.

##### `stream(input: HumanInTheLoopInput): AsyncGenerator<string>`

Stream responses from the LLM.

### Factory Function

##### `createChain(config?: LangChainSDKConfig): HireAHumanChain`

Create a new HireAHumanChain instance.

## License

MIT
