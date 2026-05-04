#!/usr/bin/env node

/**
 * HireAHuman Dev Script
 * 
 * Starts all 4 servers in background:
 * - MCP HTTP server (port 3001)
 * - REST API (port 3000)
 * - Worker App (port 3002)
 * - Admin Dashboard (port 3003)
 */

const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../..');

// ANSI colors for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const servers = [];

// Track if we're shutting down
let isShuttingDown = false;

function log(server, message) {
  console.log(`${server.color}[${server.name}]${colors.reset} ${message}`);
}

function startServer(name, command, args, port, color, cwdOverride) {
  const server = {
    name,
    port,
    process: null,
    color,
  };

  console.log(`${color}Starting ${name} on port ${port}...${colors.reset}`);

  const spawnOpts = {
    cwd: cwdOverride || rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PORT: port.toString(),
    },
  };

  server.process = spawn(command, args, spawnOpts);

  server.process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    }
  });

  server.process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    }
  });

  server.process.on('error', (err) => {
    console.error(`${color}[${name}] Error: ${err.message}${colors.reset}`);
  });

  server.process.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`${color}[${name}] Process exited with code ${code}${colors.reset}`);
    }
  });

  servers.push(server);
  return server;
}

function printBanner() {
  console.log(`
${colors.bright}${colors.cyan}
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗   ██╗ ██████╗ ████████╗███████╗███████╗                ║
║   ██║   ██║██╔═══██╗╚══██╔══╝██╔════╝██╔════╝                ║
║   ██║   ██║██║   ██║   ██║   █████╗  ███████╗                ║
║   ╚██╗ ██╔╝██║   ██║   ██║   ██╔══╝  ╚════██║                ║
║    ╚████╔╝ ╚██████╔╝   ██║   ███████╗███████║                ║
║     ╚═══╝   ╚═════╝    ╚═╝   ╚══════╝╚══════╝                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
${colors.reset}
  `);
  console.log(`${colors.cyan}  Dev server starting...${colors.reset}\n`);
}

function printStatus() {
  console.log(`
${colors.bright}Services:${colors.reset}
${colors.green}MCP HTTP Server${colors.reset}  → http://localhost:3001/mcp
${colors.green}REST API${colors.reset}        → http://localhost:3000
${colors.green}Worker App${colors.reset}       → http://localhost:3002
${colors.green}Admin Dashboard${colors.reset}  → http://localhost:3003
${colors.reset}
Press ${colors.yellow}Ctrl+C${colors.reset} to stop all servers.
`);
}

async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${colors.yellow}Shutting down all servers...${colors.reset}\n`);

  for (const server of servers) {
    try {
      log(server, 'Stopping...');
      server.process.kill('SIGTERM');
    } catch (err) {
      console.error(`Error stopping ${server.name}:`, err);
    }
  }

  // Give processes time to clean up
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`${colors.green}All servers stopped.${colors.reset}\n`);
  process.exit(0);
}

async function main() {
  printBanner();

  const workerAppDir = path.join(rootDir, 'packages/worker-app');
  const adminDashDir = path.join(rootDir, 'packages/admin-dashboard');

  // Start MCP HTTP server (port 3001) - runs from root (src/index-http.ts)
  startServer('MCP HTTP', 'npx', ['tsx', 'packages/mcp-server/src/index-http.ts'], 3001, colors.magenta);

  // Wait a moment for MCP server to initialize
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Start REST API (port 3000) - runs from root (src/index.ts)
  startServer('REST API', 'npx', ['tsx', 'packages/api/src/index.ts'], 3000, colors.blue);

  // Start Worker App (port 3002) - runs from packages/worker-app (next.config + app/ are there)
  startServer('Worker App', 'npx', ['next', 'dev', '-p', '3002'], 3002, colors.green, workerAppDir);

  // Start Admin Dashboard (port 3003) - runs from packages/admin-dashboard
  startServer('Admin Dashboard', 'npx', ['next', 'dev', '-p', '3003'], 3003, colors.yellow, adminDashDir);

  printStatus();

  // Handle Ctrl+C gracefully
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  process.on('exit', () => {
    if (!isShuttingDown) {
      console.log(`\n${colors.yellow}Shutting down...${colors.reset}`);
    }
  });
}

main().catch(console.error);
