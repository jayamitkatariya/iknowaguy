import chalk from 'chalk';
import { Command } from './command';
import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import { printMiniBanner } from '../lib/ascii';
import * as path from 'path';
import * as dotenv from 'dotenv';

const rootDir = path.resolve(__dirname, '../../../../');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const W = chalk.white.bold;
const D = chalk.white.dim;

const MCP_PORT = process.env.PORT || '3001';
const API_PORT = process.env.API_PORT || '3000';
const WORKER_PORT = process.env.WORKER_PORT || '3002';
const AGENT_PORTAL_PORT = process.env.AGENT_PORTAL_PORT || '3003';

export class Dev implements Command {
  name = 'dev';
  description = 'Start local development servers (MCP + API + Worker App)';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🔧 HireAHuman Dev\n'));
    printMiniBanner('dev');

    if (!existsSync('.env') && !existsSync('.env.local')) {
      console.log(W('❌ .env or .env.local not found. Run "hireahuman init" first.\n'));
      process.exit(1);
    }

    if (!existsSync('node_modules')) {
      console.log(D('📦 Installing dependencies...'));
      execSync('npm install', { stdio: 'inherit' as const });
    }

    console.log(W('✅ Starting all servers...\n'));
    console.log(W('  ┌──────────────────────────────────────────────┐'));
    console.log(W('  │  HireAHuman Development Environment           │'));
    console.log(W('  └──────────────────────────────────────────────┘'));
    console.log('');
    console.log(D('  MCP Server:   http://localhost:' + MCP_PORT));
    console.log(D('  REST API:     http://localhost:' + API_PORT));
    console.log(D('  Worker App:   http://localhost:' + WORKER_PORT));
    console.log(D('  Agent Portal: http://localhost:' + AGENT_PORTAL_PORT));
    console.log('');
    console.log(W('  📡 Endpoints:'));
    console.log(D('    MCP HTTP:   http://localhost:' + MCP_PORT + '/mcp'));
    console.log(D('    REST API:   http://localhost:' + API_PORT + '/api'));
    console.log(D('    Health:     http://localhost:' + MCP_PORT + '/health'));
    console.log('');
    console.log(W('  🧪 Test MCP:'));
    console.log(D('    curl -X POST http://localhost:' + MCP_PORT + '/mcp \\'));
    console.log(D('      -H "Content-Type: application/json" \\'));
    console.log(D('      -H "Authorization: Bearer ' + (process.env.HIREAHUMAN_API_KEY || 'YOUR_API_KEY') + '" \\'));
    console.log(D('      -d \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"humans_list","arguments":{}}}\''));
    console.log('');

    const mcp = spawn('npm', ['run', 'dev:http'], {
      stdio: 'pipe',
      shell: true,
      cwd: path.resolve(rootDir, 'packages/mcp-server'),
      env: { ...process.env, PORT: MCP_PORT },
    });
    mcp.stdout?.on('data', (d) => process.stdout.write(W('[MCP] ') + d));
    mcp.stderr?.on('data', (d) => process.stderr.write(W('[MCP ERR] ') + d));

    const api = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true,
      cwd: path.resolve(rootDir, 'packages/api'),
      env: { ...process.env, PORT: API_PORT },
    });
    api.stdout?.on('data', (d) => process.stdout.write(W('[API] ') + d));
    api.stderr?.on('data', (d) => process.stderr.write(W('[API ERR] ') + d));

    const worker = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(rootDir, 'packages/worker-app'),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: WORKER_PORT },
    });
    worker.stdout?.on('data', (d) => process.stdout.write(W('[Worker] ') + d));
    worker.stderr?.on('data', (d) => process.stderr.write(W('[Worker ERR] ') + d));

    const agentPortal = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(rootDir, 'packages/agent-portal'),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: AGENT_PORTAL_PORT },
    });
    agentPortal.stdout?.on('data', (d) => process.stdout.write(W('[AgentPortal] ') + d));
    agentPortal.stderr?.on('data', (d) => process.stderr.write(W('[AgentPortal ERR] ') + d));

    process.on('SIGINT', () => {
      console.log(W('\n\n👋 Shutting down...'));
      mcp.kill();
      api.kill();
      worker.kill();
      agentPortal.kill();
      process.exit(0);
    });
  }
}
