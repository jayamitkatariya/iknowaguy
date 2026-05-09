/**
 * start command - Start API and MCP servers
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { spawn } from 'child_process';
import { join } from 'path';
import { readConfig, writePid, RUN_DIR } from '../lib/config.js';
import { mkdirSync, existsSync } from 'fs';

const C = chalk.green;
const W = chalk.white.bold;

export class Start {
  name = 'start';
  description = 'Start API server and MCP server';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🚀 Starting iknowaguy\n'));

    const config = readConfig();
    if (!config) {
      console.error(chalk.red('Error: iknowaguy not initialized. Run "iknowaguy init" first.\n'));
      process.exit(1);
    }

    // Determine ports
    let apiPort = config.api_port || 3001;
    let mcpPort = config.mcp_port || 3000;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--api-port' && args[i + 1]) {
        apiPort = parseInt(args[i + 1], 10);
        i++;
      } else if (args[i] === '--mcp-port' && args[i + 1]) {
        mcpPort = parseInt(args[i + 1], 10);
        i++;
      }
    }

    // Create run directory
    mkdirSync(RUN_DIR, { recursive: true });

    // Get the packages directory
    const packagesDir = join(process.cwd(), 'packages');
    const apiDist = join(packagesDir, 'api', 'dist', 'index.js');
    const mcpDist = join(packagesDir, 'mcp-server', 'dist', 'index.js');

    // Check if dist exists
    if (!existsSync(apiDist)) {
      console.error(chalk.red(`Error: API dist not found at ${apiDist}`));
      console.error('Please run "pnpm build" first.\n');
      process.exit(1);
    }

    if (!existsSync(mcpDist)) {
      console.error(chalk.red(`Error: MCP server dist not found at ${mcpDist}`));
      console.error('Please run "pnpm build" first.\n');
      process.exit(1);
    }

    // Start API server
    console.log(C('Starting API server on port ' + apiPort + '...'));
    const apiEnv = {
      ...process.env,
      SUPABASE_URL: config.supabase_url,
      SUPABASE_SERVICE_ROLE_KEY: config.supabase_service_role_key,
      API_PORT: apiPort.toString(),
      PORT: apiPort.toString(),
    };

    const apiProcess = spawn('node', [apiDist], {
      env: apiEnv,
      detached: true,
      stdio: 'ignore',
    });

    apiProcess.unref();
    writePid('api', apiProcess.pid!);
    console.log(C(`   API server started (PID: ${apiProcess.pid})`));

    // Start MCP server (stdio mode for AI agents)
    console.log(C('Starting MCP server on port ' + mcpPort + '...'));
    const mcpEnv = {
      ...process.env,
      SUPABASE_URL: config.supabase_url,
      SUPABASE_SERVICE_ROLE_KEY: config.supabase_service_role_key,
      PORT: mcpPort.toString(),
    };

    const mcpProcess = spawn('node', [mcpDist, '--stdio'], {
      env: mcpEnv,
      detached: true,
      stdio: 'ignore',
    });

    mcpProcess.unref();
    writePid('mcp', mcpProcess.pid!);
    console.log(C(`   MCP server started (PID: ${mcpProcess.pid})`));

    console.log(W('\n✅ iknowaguy is running on ports ' + mcpPort + ' (MCP) and ' + apiPort + ' (API)\n'));
  }
}