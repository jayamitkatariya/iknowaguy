import * as chalk from 'chalk';
import { Command } from './command';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { printMiniBanner } from '../lib/ascii';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env.local first - dev.ts is in packages/cli/src/commands/
// rootDir = packages/cli/src/commands/ → ../../../ = hireahuman/
const rootDir = path.resolve(__dirname, '../../..');
dotenv.config({ path: path.resolve(rootDir, '.env.local') });

const W = chalk.white.bold;
const D = chalk.white.dim;

const PORT = process.env.PORT || '3001';
const API_PORT = process.env.API_PORT || '3000';

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
      spawn('npm', ['install'], { stdio: 'inherit', shell: true });
    }

    console.log(W('✅ Starting all servers...\n'));
    console.log(W('  ┌──────────────────────────────────────────────┐'));
    console.log(W('  │  HireAHuman Development Environment           │'));
    console.log(W('  └──────────────────────────────────────────────┘'));
    console.log('');
    console.log(D('  MCP Server:   http://localhost:' + PORT));
    console.log(D('  REST API:     http://localhost:' + API_PORT));
    console.log(D('  Worker App:   http://localhost:3002'));
    console.log(D('  Admin:        http://localhost:3003'));
    console.log('');
    console.log(W('  📡 Endpoints:'));
    console.log(D('    MCP HTTP:   http://localhost:' + PORT + '/mcp'));
    console.log(D('    REST API:   http://localhost:' + API_PORT + '/api'));
    console.log(D('    Health:     http://localhost:' + PORT + '/health'));
    console.log('');
    console.log(W('  🧪 Test MCP:'));
    console.log(D('    curl -X POST http://localhost:' + PORT + '/mcp \\'));
    console.log(D('      -H "Content-Type: application/json" \\'));
    console.log(D('      -H "Authorization: Bearer ' + (process.env.HIREAHUMAN_API_KEY || 'YOUR_API_KEY') + '" \\'));
    console.log(D('      -d \'{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"humans_list","arguments":{}}}\''));
    console.log('');

    // Start MCP server (HTTP mode)
    const mcp = spawn('npx', ['tsx', 'packages/mcp-server/src/index-http.ts'], {
      stdio: 'pipe',
      shell: true,
      cwd: path.resolve(__dirname, '../../../../'),
      env: { ...process.env },
    });
    mcp.stdout?.on('data', (d) => process.stdout.write(W('[MCP] ') + d));
    mcp.stderr?.on('data', (d) => process.stderr.write(W('[MCP ERR] ') + d));

    // Start API
    const api = spawn('npx', ['tsx', 'packages/api/src/index.ts'], {
      stdio: 'pipe',
      shell: true,
      cwd: path.resolve(__dirname, '../../../../'),
      env: { ...process.env },
    });
    api.stdout?.on('data', (d) => process.stdout.write(W('[API] ') + d));
    api.stderr?.on('data', (d) => process.stderr.write(W('[API ERR] ') + d));

    // Start Worker App (Next.js dev)
    const worker = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '../../../../packages/worker-app'),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env },
    });
    worker.stdout?.on('data', (d) => process.stdout.write(W('[Worker] ') + d));
    worker.stderr?.on('data', (d) => process.stderr.write(W('[Worker ERR] ') + d));

    // Start Admin Dashboard
    const admin = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '../../../../packages/admin-dashboard'),
      stdio: 'pipe',
      shell: true,
      env: { ...process.env },
    });
    admin.stdout?.on('data', (d) => process.stdout.write(W('[Admin] ') + d));
    admin.stderr?.on('data', (d) => process.stderr.write(W('[Admin ERR] ') + d));

    // Wait for Ctrl+C
    process.on('SIGINT', () => {
      console.log(W('\n\n👋 Shutting down...'));
      mcp.kill();
      api.kill();
      worker.kill();
      admin.kill();
      process.exit(0);
    });
  }
}
