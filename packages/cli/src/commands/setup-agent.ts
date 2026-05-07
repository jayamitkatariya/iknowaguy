import chalk from 'chalk';
import { Command } from './command';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import inquirer from 'inquirer';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

const HERMES_AGENT_PATH = '~/.hermes/config.yaml';
const OPENCLAW_CONFIG_PATHS = [
  '~/.openclaw/config.json',
  '~/.config/openclaw/config.json',
];

export class SetupAgent implements Command {
  name = 'setup:agent';
  description = 'Link HireAHuman to your AI agent (Hermes Agent, OpenClaw, etc.)';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🔗 AI Agent Setup\n'));
    printMiniBanner('setup:agent');

    const agentType = await this.detectAgent();
    console.log(D(`Detected: ${agentType || 'Unknown agent'}`));

    let mcpConfig: any = {};
    const mcpConfigPath = 'hireahuman-mcp.json';
    if (existsSync(mcpConfigPath)) {
      mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
    }

    const apiKey = process.env.HIREAHUMAN_API_KEY || mcpConfig.api_key || '';

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'agent',
        message: 'Which AI agent are you setting up?',
        choices: [
          { name: 'Hermes Agent', value: 'hermes' },
          { name: 'OpenClaw', value: 'openclaw' },
          { name: 'Claude Code (via MCP)', value: 'claude' },
          { name: 'Other (manual)', value: 'manual' },
        ],
        default: agentType === 'hermes' ? 'hermes' : agentType === 'openclaw' ? 'openclaw' : 'manual',
      },
    ]);

    if (!apiKey) {
      console.log(W('\n❌ No API key found. Run "hireahuman init" first or set HIREAHUMAN_API_KEY.\n'));
      return;
    }

    switch (answers.agent) {
      case 'hermes':
        await this.setupHermes(apiKey);
        break;
      case 'openclaw':
        await this.setupOpenClaw(apiKey);
        break;
      case 'claude':
        await this.setupClaude(apiKey);
        break;
      default:
        this.showManualInstructions(apiKey);
    }
  }

  private async detectAgent(): Promise<string | null> {
    const hermesPath = join(process.env.HOME || '~', '.hermes/config.yaml');
    if (existsSync(hermesPath)) return 'hermes';

    for (const p of OPENCLAW_CONFIG_PATHS) {
      const expanded = p.replace('~', process.env.HOME || '~');
      if (existsSync(expanded)) return 'openclaw';
    }
    return null;
  }

  private async setupHermes(apiKey: string): Promise<void> {
    console.log(W('\n📡 Setting up Hermes Agent...\n'));

    const hermesDir = join(process.env.HOME || '~', '.hermes');
    const mcpConfigPath = join(hermesDir, 'mcp_servers.json');

    if (existsSync(mcpConfigPath)) {
      const current = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
      const hireahumanEntry = {
        name: 'hireahuman',
        url: 'http://localhost:3001/mcp',
        api_key: apiKey,
      };

      const servers = current.mcp_servers || current || [];
      const filtered = servers.filter((s: any) => s.name !== 'hireahuman');
      filtered.push(hireahumanEntry);

      writeFileSync(mcpConfigPath, JSON.stringify({ mcp_servers: filtered }, null, 2));
      console.log(W(`✅ Updated ${mcpConfigPath}`));
    } else {
      const config = {
        mcp_servers: [
          {
            name: 'hireahuman',
            url: 'http://localhost:3001/mcp',
            api_key: apiKey,
          },
        ],
      };
      writeFileSync(join(hermesDir, 'mcp_servers.json'), JSON.stringify(config, null, 2));
      console.log(W(`✅ Created mcp_servers.json`));
    }

    try {
      const { default: axios } = await import('axios');
      await axios.post('http://localhost:3000/reload-mcp', {}, { timeout: 1000 }).catch(() => {});
    } catch {}

    console.log(W('\n✅ Hermes Agent configured!\n'));
    console.log(W('Your Hermes Agent can now call humans via HireAHuman.\n'));
    console.log(D('Restart Hermes Agent to load the new MCP server.\n'));
  }

  private async setupOpenClaw(apiKey: string): Promise<void> {
    console.log(W('\n📡 Setting up OpenClaw...\n'));

    const configPaths = [
      join(process.env.HOME || '~', '.openclaw/config.json'),
      join(process.env.HOME || '~', '.config/openclaw/config.json'),
    ];

    let configPath = configPaths.find((p) => existsSync(p.replace('~', process.env.HOME || '~')));

    if (!configPath) {
      configPath = join(process.env.HOME || '~', '.openclaw/config.json');
    }

    let config: any = { mcpServers: {} };
    const expandedPath = configPath.replace('~', process.env.HOME || '~');
    if (existsSync(expandedPath)) {
      try {
        config = JSON.parse(readFileSync(expandedPath, 'utf-8'));
      } catch {}
    }

    config.mcpServers = config.mcpServers || {};
    config.mcpServers.hireahuman = {
      url: 'http://localhost:3001/mcp',
      apiKey,
    };

    writeFileSync(expandedPath, JSON.stringify(config, null, 2));
    console.log(W(`✅ Updated ${expandedPath}`));

    console.log(W('\n✅ OpenClaw configured!\n'));
    console.log(D('Restart OpenClaw to load the new MCP server.\n'));
  }

  private async setupClaude(apiKey: string): Promise<void> {
    console.log(W('\n📡 Setting up Claude Code MCP...\n'));

    const claudeConfigPath = join(process.env.HOME || '~', '.claude.json');
    let config: any = { mcpServers: {} };

    if (existsSync(claudeConfigPath)) {
      try {
        config = JSON.parse(readFileSync(claudeConfigPath, 'utf-8'));
      } catch {}
    }

    config.mcpServers = config.mcpServers || {};
    config.mcpServers.hireahuman = {
      type: 'http',
      url: 'http://localhost:3001/mcp',
      headers: { Authorization: `Bearer ${apiKey}` },
    };

    writeFileSync(claudeConfigPath, JSON.stringify(config, null, 2));
    console.log(W(`✅ Updated ${claudeConfigPath}`));

    console.log(W('\n✅ Claude Code MCP configured!\n'));
    console.log(D('Restart Claude Code to load the new MCP server.\n'));
  }

  private showManualInstructions(apiKey: string): void {
    console.log(W('\n📋 Manual Setup Instructions\n'));
    console.log('Add this to your agent\'s MCP configuration:\n');
    console.log(W(JSON.stringify({
      name: 'hireahuman',
      url: 'http://localhost:3001/mcp',
      api_key: apiKey,
    }, null, 2)));
    console.log('');
    console.log(D('For production, replace localhost:3001 with your deployed MCP server URL.'));
    console.log('');
  }
}
