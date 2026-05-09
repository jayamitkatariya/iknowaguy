# @iknowaguy/langchain-sdk

LangChain integration for iknowaguy human-in-the-loop.

## Installation

```bash
npm install @iknowaguy/langchain-sdk
```

## Usage

```typescript
import { iknowaguyChain, createChain } from '@iknowaguy/langchain-sdk';

const chain = new iknowaguyChain({
  apiKey: 'your-api-key',
});

const response = await chain.invoke({
  task: 'Review this image for policy compliance',
  context: { imageUrl: 'https://...' },
  humanFallback: true,
});
```

## API

### iknowaguyChain

#### Constructor

```typescript
new iknowaguyChain(config?: LangChainSDKConfig)
```

##### LangChainSDKConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `apiKey` | `string` | Your API key for authentication | - |
| `endpoint` | `string` | API endpoint URL (default: `http://localhost:3001`) | - |
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

##### `createChain(config?: LangChainSDKConfig): iknowaguyChain`

Create a new iknowaguyChain instance.

## Local-First Architecture

This SDK connects to the iknowaguy MCP server running locally at `http://localhost:3001`. The MCP server must be started with `iknowaguy start` before using the SDK.

## License

MIT