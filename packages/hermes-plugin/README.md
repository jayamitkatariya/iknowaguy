# @hireahuman/hermes-plugin

A connector plugin for integrating with Hermes - the human-in-the-loop orchestration layer.

## Installation

```bash
npm install @hireahuman/hermes-plugin
# or
pnpm add @hireahuman/hermes-plugin
# or
yarn add @hireahuman/hermes-plugin
```

## Usage

```typescript
import { HermesPlugin } from '@hireahuman/hermes-plugin';

const hermes = new HermesPlugin({
  apiKey: 'your-api-key',
  endpoint: 'https://api.hireahuman.io',
});

// Submit a task for human processing
const task = await hermes.submitTask({
  id: 'task-123',
  type: 'image-review',
  payload: { imageUrl: 'https://...' },
  priority: 'high',
});

// Check task status
const status = await hermes.getTaskStatus('task-123');

// Cancel a task
await hermes.cancelTask('task-123');
```

## API

### HermesPlugin

#### Constructor

```typescript
new HermesPlugin(config?: HermesPluginConfig)
```

##### HermesPluginConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `apiKey` | `string` | Your API key for authentication | - |
| `endpoint` | `string` | API endpoint URL | `https://api.hireahuman.io` |
| `timeout` | `number` | Request timeout in milliseconds | `30000` |

#### Methods

##### `submitTask(task: Task): Promise<TaskResult>`

Submit a task to Hermes for human processing.

##### `getTaskStatus(taskId: string): Promise<TaskResult>`

Get the current status of a submitted task.

##### `cancelTask(taskId: string): Promise<TaskResult>`

Cancel a pending task.

## License

MIT
