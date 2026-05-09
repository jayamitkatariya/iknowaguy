/**
 * stop command - Stop running servers
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { readPid, RUN_DIR } from '../lib/config.js';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const C = chalk.green;
const W = chalk.white.bold;
const R = chalk.red;

export class Stop {
  name = 'stop';
  description = 'Stop running servers';

  async run(_args: string[]): Promise<void> {
    console.log(W('\n🛑 Stopping iknowaguy\n'));

    let stopped = false;

    // Stop API server
    const apiPid = readPid('api');
    if (apiPid) {
      try {
        process.kill(apiPid, 'SIGTERM');
        console.log(C(`   API server (PID: ${apiPid}) stopped`));
        removePid('api');
        stopped = true;
      } catch {
        // Process might already be dead
        removePid('api');
      }
    }

    // Stop MCP server
    const mcpPid = readPid('mcp');
    if (mcpPid) {
      try {
        process.kill(mcpPid, 'SIGTERM');
        console.log(C(`   MCP server (PID: ${mcpPid}) stopped`));
        removePid('mcp');
        stopped = true;
      } catch {
        // Process might already be dead
        removePid('mcp');
      }
    }

    if (stopped) {
      console.log(C('\n✅ iknowaguy stopped\n'));
    } else {
      console.log(W('No running servers found.\n'));
    }
  }
}

function removePid(name: string): void {
  const pidFile = join(RUN_DIR, `${name}.pid`);
  try {
    if (existsSync(pidFile)) {
      unlinkSync(pidFile);
    }
  } catch {}
}