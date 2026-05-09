#!/usr/bin/env node
/**
 * iknowaguy CLI bin entry
 * Runs the CLI from the compiled dist directory
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// dist is one level up from bin/
const distPath = join(__dirname, '..', 'dist', 'index.js');

const args = process.argv.slice(2);
const command = args[0];

if (!command) {
  console.log(`iknowaguy CLI v0.1.0

Usage: iknowaguy <command> [options]

Commands:
  init       Initialize iknowaguy (register tenant)
  start      Start API server and MCP server
  stop       Stop running servers
  status     Check if servers are running
  version    Show version info

Run 'iknowaguy <command> --help' for more info.
`);
  process.exit(0);
}

spawn('node', [distPath, ...args], { stdio: 'inherit' }).on('exit', (code) => {
  process.exit(code || 0);
});