# @hireahuman/openclaw-plugin

A connector plugin for integrating with OpenClaw - browser automation for physical world tasks.

## Installation

```bash
npm install @hireahuman/openclaw-plugin
# or
pnpm add @hireahuman/openclaw-plugin
# or
yarn add @hireahuman/openclaw-plugin
```

## Usage

```typescript
import { OpenClawPlugin } from '@hireahuman/openclaw-plugin';

const openclaw = new OpenClawPlugin({
  apiKey: 'your-api-key',
  endpoint: 'https://api.openclaw.io',
  headless: true,
});

// Create a browser session
const { sessionId } = await openclaw.createSession();

// Execute browser automation tasks
const task = await openclaw.executeTask({
  id: 'task-456',
  action: 'navigate',
  target: 'https://example.com',
});

// Take a screenshot
const screenshot = await openclaw.screenshot(sessionId);

// Close the session
await openclaw.closeSession(sessionId);
```

## API

### OpenClawPlugin

#### Constructor

```typescript
new OpenClawPlugin(config?: OpenClawPluginConfig)
```

##### OpenClawPluginConfig

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `apiKey` | `string` | Your API key for authentication | - |
| `endpoint` | `string` | API endpoint URL | `https://api.openclaw.io` |
| `timeout` | `number` | Request timeout in milliseconds | `60000` |
| `headless` | `boolean` | Run browser in headless mode | `true` |

#### Methods

##### `executeTask(task: BrowserTask): Promise<BrowserResult>`

Execute a browser automation task.

##### `createSession(sessionId?: string): Promise<{ sessionId: string }>`

Create a new browser session.

##### `screenshot(sessionId: string): Promise<BrowserResult>`

Take a screenshot of the current browser state.

##### `closeSession(sessionId: string): Promise<BrowserResult>`

Close a browser session.

## License

MIT
