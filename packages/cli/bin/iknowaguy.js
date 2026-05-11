#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distPath = join(__dirname, '..', 'dist', 'index.js');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`iknowaguy CLI v0.1.0

Usage: iknowaguy <command> [options]

Commands:
  init       Initialize iknowaguy (register tenant)
  start      Start the MCP proxy for AI agents
  stop       Stop running proxy
  status     Check if proxy is running
  version    Show version info
`);
  process.exit(0);
}

const child = spawn(process.execPath, [distPath, ...args], { stdio: 'inherit' });
child.on('error', (err) => {
  console.error(`Failed to start iknowaguy: ${err.message}`);
  process.exit(1);
});
child.on('exit', (code) => {
  process.exit(code || 0);
});
