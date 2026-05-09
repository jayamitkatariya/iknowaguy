/**
 * version command - Show version info
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { readConfig } from '../lib/config.js';
import { dirname } from 'path';

const W = chalk.white.bold;
const G = chalk.gray;
const C = chalk.cyan;

export class Version {
  name = 'version';
  description = 'Show version info';

  async run(_args: string[]): Promise<void> {
    console.log(W('\n📦 iknowaguy Version\n'));
    console.log(C('CLI version: ') + W('0.1.0'));

    const config = readConfig();
    if (config) {
      console.log(C('MCP version: ') + W(config.version));
      console.log(C('Tenant ID: ') + W(config.tenant_id));
      console.log(C('API port: ') + W(config.api_port.toString()));
      console.log(C('MCP port: ') + W(config.mcp_port.toString()));
    } else {
      console.log(G('Not initialized'));
    }

    console.log('');
  }
}