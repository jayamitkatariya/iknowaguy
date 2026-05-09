/**
 * init command - Register tenant and create config
 * 
 * Flow:
 * 1. Check if already initialized → show existing config
 * 2. If API is reachable on localhost:3001 → call /auth/register directly
 * 3. If not reachable → prompt for Supabase credentials, create tenant directly
 * 4. Save config to ~/.iknowaguy/config.json
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { readConfig, writeConfig, CONFIG_FILE } from '../lib/config.js';

const C = chalk.green;
const W = chalk.white.bold;
const Y = chalk.yellow;

export class Init {
  name = 'init';
  description = 'Initialize iknowaguy (register tenant)';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🚀 Initializing iknowaguy\n'));

    // Check if already initialized
    const existing = readConfig();
    if (existing) {
      console.log(C('✅ iknowaguy is already initialized!'));
      console.log(`   Tenant ID: ${existing.tenant_id}`);
      console.log(`   API Key: ${existing.api_key.substring(0, 20)}...`);
      console.log(`   Config: ${CONFIG_FILE}\n`);
      console.log('Run "iknowaguy start" to start the servers.\n');
      return;
    }

    // Parse flags
    let name = 'My Workspace';
    let email = '';
    let password = '';

    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--name' && args[i + 1]) {
        name = args[i + 1];
        i++;
      } else if (args[i] === '--email' && args[i + 1]) {
        email = args[i + 1];
        i++;
      } else if (args[i] === '--password' && args[i + 1]) {
        password = args[i + 1];
        i++;
      }
    }

    if (!email || !password) {
      console.log(Y('📋 To initialize, provide --email and --password:'));
      console.log('   iknowaguy init --email you@example.com --password "YourPassword123" [--name "My Workspace"]\n');
      console.log('Or run without args for interactive mode (coming soon).\n');
      return;
    }

    // Generate slug from email
    const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase() + '-' + Date.now().toString(36);

    console.log(C('📡 Connecting to registration service...'));

    try {
      // Try calling the local API first
      const response = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, email, password }),
      });

      if (response.ok) {
        const data = await response.json() as any;
        
        if (data.data?.api_key) {
          // Success from local API
          const config = {
            version: '0.1.0',
            tenant_id: data.data.tenant?.id || data.data.tenant_id || `tenant_${Date.now()}`,
            api_key: data.data.api_key,
            supabase_url: data.data.tenant?.supabase_url || process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
            supabase_service_role_key: data.data.tenant?.supabase_service_role_key || process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
            api_port: 3001,
            mcp_port: 3000,
          };

          writeConfig(config);

          console.log(C('\n✅ You\'re connected! API key saved.\n'));
          console.log(`   Tenant: ${config.tenant_id}`);
          console.log(`   API Key: ${config.api_key.substring(0, 20)}...`);
          console.log(W('\nNext steps:'));
          console.log('  1. Run ' + C('iknowaguy start') + ' to start the servers');
          console.log('  2. Connect your AI agent using the MCP server at port 3000\n');
          console.log('Config saved to: ' + CONFIG_FILE + '\n');
          return;
        }
      }

      // API returned but wasn't ok or didn't have expected data — show error
      const errorText = await response.text();
      console.log(chalk.red(`\n❌ Registration failed (${response.status}): ${errorText}\n`));
      process.exit(1);

    } catch (err: any) {
      // Local API not running — check if Supabase env vars are set for direct registration
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.log(Y('⚠️  Local API not running. Registering directly via Supabase...'));
        
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        const apiKey = `hah_${Buffer.from(Math.random().toString(36)).toString('base64').replace(/[/+=]/g, '').substring(0, 24)}`;

        const { data, error } = await supabase
          .from('tenants')
          .insert({ name, slug, api_key: apiKey })
          .select('id')
          .single();

        if (error || !data) {
          console.log(chalk.red(`\n❌ Failed to create tenant in Supabase: ${error?.message}\n`));
          process.exit(1);
        }

        const config = {
          version: '0.1.0',
          tenant_id: data.id as string,
          api_key: apiKey,
          supabase_url: process.env.SUPABASE_URL,
          supabase_service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY,
          api_port: 3001,
          mcp_port: 3000,
        };

        writeConfig(config);

        console.log(C('\n✅ Tenant registered directly via Supabase. Config saved.\n'));
        console.log(`   Tenant: ${config.tenant_id}`);
        console.log(`   API Key: ${config.api_key.substring(0, 20)}...`);
        console.log(W('\nNext steps:'));
        console.log('  1. Run ' + C('iknowaguy start') + ' to start the servers');
        console.log('  2. Connect your AI agent using the MCP server at port 3000\n');
        return;
      }

      console.log(chalk.red(`\n❌ Cannot reach iknowaguy API at http://localhost:3001`));
      console.log(chalk.red('   Make sure the API is running, or set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY env vars.\n'));
      console.log('To start the API: npx @iknowaguy/api\n');
      process.exit(1);
    }
  }
}