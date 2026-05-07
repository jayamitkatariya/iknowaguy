import chalk from 'chalk';
import { nanoid } from 'nanoid';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Command } from './command';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

const TEMPLATE_ENV = `# HireAHuman Environment
# Copy this to .env and fill in your values

# Supabase Project URL (from supabase.com dashboard)
SUPABASE_URL=https://your-project.supabase.co

# Supabase Service Role Key (from supabase.com > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HireAHuman API Key (generate with: hireahuman api-key:generate)
HIREAHUMAN_API_KEY=***

# MCP Server Port
PORT=3001

# API Server Port
API_PORT=3000

# Worker App URL (for notifications)
WORKER_APP_URL=http://localhost:3002

# Admin Dashboard URL
ADMIN_APP_URL=http://localhost:3003
`;

export class Init implements Command {
  name = 'init';
  description = 'Initialize HireAHuman in your project';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🚀 HireAHuman Init\n'));
    printMiniBanner('init');

    const nodeVersion = process.version;
    console.log(D(`Node.js: ${nodeVersion}`));

    const projectDir = process.cwd();
    console.log(D(`Project: ${projectDir}`));
    console.log('');

    const inquirer = (await import('inquirer')).default;
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'supabaseUrl',
        message: 'Supabase Project URL:',
        default: 'https://your-project.supabase.co',
        validate: (input: string) => {
          if (!input.startsWith('https://')) return 'Must start with https://';
          return true;
        },
      },
      {
        type: 'input',
        name: 'supabaseKey',
        message: 'Supabase Service Role Key:',
        default: '',
        validate: (input: string) => {
          if (!input || input.length < 20) return 'Please enter a valid service role key';
          return true;
        },
      },
      {
        type: 'input',
        name: 'tenantName',
        message: 'Your Team / Tenant Name:',
        default: 'My Team',
      },
    ]);

    const { supabaseUrl, supabaseKey, tenantName } = answers;
    const apiKey = `hak_live_${nanoid(24)}`;
    const apiKeyPrefix = apiKey.slice(0, 12);

    const envContent = TEMPLATE_ENV
      .replace('https://your-project.supabase.co', supabaseUrl)
      .replace('your-service-role-key', supabaseKey)
      .replace('***', apiKey);

    const envPath = join(projectDir, '.env');
    writeFileSync(envPath, envContent);
    console.log(W(`✅ Created .env`));

    const configContent = `const config = {
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  api: {
    port: parseInt(process.env.PORT || '3001'),
  },
  workerApp: {
    url: process.env.WORKER_APP_URL || 'http://localhost:3002',
  },
  adminApp: {
    url: process.env.ADMIN_APP_URL || 'http://localhost:3003',
  },
};

export default config;
`;
    const configPath = join(projectDir, 'hireahuman.config.ts');
    writeFileSync(configPath, configContent);
    console.log(W(`✅ Created hireahuman.config.ts`));

    console.log(D('\n📡 Creating tenant in Supabase...'));
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);

      const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const { error } = await supabase.from('tenants').insert({
        name: tenantName,
        slug,
        api_key: apiKey,
        api_key_prefix: apiKeyPrefix,
        contact_email: '',
        is_active: true,
      });

      if (error) {
        console.log(D(`⚠️  Could not create tenant (will need manual setup): ${error.message}`));
      } else {
        console.log(W(`✅ Created tenant: ${tenantName}`));
        console.log(D(`   API Key: ${apiKey}`));
        console.log(D(`   Save this key — you'll need it for your AI agent!`));
      }
    } catch (err: any) {
      console.log(D(`⚠️  Could not connect to Supabase: ${err.message}`));
      console.log(D('   Run the SQL in supabase/migrations/001_initial.sql manually'));
    }

    const mcpConfig = {
      mcp_servers: [
        {
          name: 'hireahuman',
          url: 'http://localhost:3001/mcp',
          api_key: apiKey,
        },
      ],
    };

    const mcpConfigPath = join(projectDir, 'hireahuman-mcp.json');
    writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));
    console.log(W(`\n✅ Created hireahuman-mcp.json`));

    console.log(W('\n📋 Next Steps:\n'));
    console.log(`  1. ${W('Run the SQL schema')} in Supabase SQL Editor`);
    console.log(`     → supabase/migrations/001_initial.sql`);
    console.log(`  2. ${W('Start development:')}`);
    console.log(`     → hireahuman dev`);
    console.log(`  3. ${W('Link your AI agent:')}`);
    console.log(`     → hireahuman setup:agent`);
    console.log(`\n${W('✅ Init complete!')}\n`);
  }
}
