/**
 * status command - Check if servers are running
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { readPid, readConfig, CONFIG_FILE } from '../lib/config.js';

const C = chalk.green;
const W = chalk.white.bold;
const G = chalk.gray;

export class Status {
  name = 'status';
  description = 'Check if servers are running';

  async run(_args: string[]): Promise<void> {
    console.log(W('\n📊 iknowaguy Status\n'));

    const config = readConfig();
    if (!config) {
      console.log(G('Not initialized. Run "iknowaguy init" first.\n'));
      return;
    }

    console.log(W('Config: ') + G(CONFIG_FILE));
    console.log(W('Tenant: ') + G(config.tenant_id));
    console.log('');

    // Check API server
    const apiPid = readPid('api');
    if (apiPid) {
      try {
        process.kill(apiPid, 0);
        console.log(C('✓') + ' API server running (PID: ' + apiPid + ', Port: ' + config.api_port + ')');
      } catch {
        console.log(chalk.red('✗') + ' API server not responding (stale PID: ' + apiPid + ')');
      }
    } else {
      console.log(chalk.gray('○') + ' API server not running');
    }

    // Check MCP server
    const mcpPid = readPid('mcp');
    if (mcpPid) {
      try {
        process.kill(mcpPid, 0);
        console.log(C('✓') + ' MCP server running (PID: ' + mcpPid + ', Port: ' + config.mcp_port + ')');
      } catch {
        console.log(chalk.red('✗') + ' MCP server not responding (stale PID: ' + mcpPid + ')');
      }
    } else {
      console.log(chalk.gray('○') + ' MCP server not running');
    }

    console.log('');
  }
}