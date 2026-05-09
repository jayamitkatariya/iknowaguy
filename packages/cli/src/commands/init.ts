/**
 * init command - Register tenant and create config
 * 
 * Flow:
 * 1. Check if already initialized → show existing config
 * 2. Parse --email, --password, --name flags
 * 3. If API server running on localhost:3001 → call /auth/register
 * 4. Otherwise → call Supabase Auth directly (requires valid anon key)
 * 5. Save config to ~/.iknowaguy/config.json
 */
import * as chalkNS from 'chalk'; const chalk = chalkNS.default;
import { readConfig, writeConfig, CONFIG_FILE } from '../lib/config.js';

const C = chalk.green;
const W = chalk.white.bold;
const Y = chalk.yellow;

const SUPABASE_URL = 'https://yktuluujkcldtvvbdmmf.supabase.co';

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

    // Strategy 1: Try calling the local API if it's running
    try {
      const localApiResponse = await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, email, password }),
      });

      if (localApiResponse.ok) {
        const data = await localApiResponse.json() as any;
        
        if (data.data?.api_key) {
          const config = {
            version: '0.1.0',
            tenant_id: data.data.tenant?.id || data.data.tenant_id,
            api_key: data.data.api_key,
            supabase_url: data.data.tenant?.supabase_url || SUPABASE_URL,
            supabase_service_role_key: data.data.tenant?.supabase_service_role_key || '',
            api_port: 3001,
            mcp_port: 3000,
          };

          writeConfig(config as any);

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

      const errorText = await localApiResponse.text();
      // If API is running but returned error, still better than falling through
      if (localApiResponse.status !== 502 && localApiResponse.status !== 503) {
        console.log(chalk.red(`\n❌ Registration via local API failed (${localApiResponse.status}): ${errorText}\n`));
        process.exit(1);
      }
    } catch {
      // Local API not running - will try Supabase Auth below
    }

    // Strategy 2: Direct Supabase Auth registration
    // This requires a valid anon key - if the key is invalid/missing, show clear error
    console.log(Y('⚠️  Local API not running. Trying Supabase Auth directly...'));

    // Check for SUPABASE_ANON_KEY env var (must be provided for direct registration)
    const anonKey = process.env.SUPABASE_ANON_KEY;
    if (!anonKey) {
      console.log(chalk.red(`\n❌ Cannot register: Local API not running and SUPABASE_ANON_KEY not set.\n`));
      console.log('To register without the local API:\n');
      console.log('  1. Set your anon key: export SUPABASE_ANON_KEY="your-anon-key"\n');
      console.log('  2. Run init again\n');
      console.log('Or start the API server first, then run init.\n');
      process.exit(1);
    }

    try {
      // Step 1: Sign up via Supabase Auth
      const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({
          email,
          password,
          options: {
            data: { name }
          }
        }),
      });

      const signupData = await signupResponse.json() as any;

      if (!signupResponse.ok) {
        const errorMsg = signupData?.msg || signupData?.error_description || JSON.stringify(signupData);
        console.log(chalk.red(`\n❌ Supabase Auth registration failed: ${errorMsg}\n`));
        process.exit(1);
      }

      // Extract session
      const session = signupData.session || signupData;
      const accessToken = session?.access_token;
      const userId = signupData.id || session?.user?.id;

      if (!accessToken || !userId) {
        console.log(chalk.red(`\n❌ Invalid response from Supabase Auth.\n`));
        process.exit(1);
      }

      console.log(C('✅ Auth registration successful'));

      // Step 2: Create tenant record (using the session token)
      console.log(C('📦 Creating tenant record...'));

      const tenantResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: userId,
          name,
          slug,
          created_at: new Date().toISOString(),
        }),
      });

      let tenantId = userId;

      if (!tenantResponse.ok) {
        const errorText = await tenantResponse.text();
        if (tenantResponse.status === 409) {
          console.log(Y('⚠️  Tenant already exists, using existing tenant ID'));
          tenantId = userId;
        } else {
          console.log(chalk.red(`\n❌ Failed to create tenant: ${errorText}\n`));
          process.exit(1);
        }
      } else {
        const tenantData = await tenantResponse.json() as any;
        tenantId = tenantData[0]?.id || userId;
        console.log(C('✅ Tenant created'));
      }

      // Step 3: Save config
      const config = {
        version: '0.1.0',
        tenant_id: tenantId,
        api_key: `iknowaguy_${Buffer.from(accessToken).toString('base64').replace(/[/+=]/g, '').substring(0, 24)}`,
        supabase_url: SUPABASE_URL,
        supabase_session: accessToken,
        supabase_service_role_key: '',
        api_port: 3001,
        mcp_port: 3000,
      };

      writeConfig(config as any);

      console.log(C('\n✅ You\'re connected! Config saved.\n'));
      console.log(`   Tenant ID: ${tenantId}`);
      console.log(W('\nNext steps:'));
      console.log('  1. Run ' + C('iknowaguy start') + ' to start the servers');
      console.log('  2. Connect your AI agent using the MCP server at port 3000\n');
      console.log('Config saved to: ' + CONFIG_FILE + '\n');

    } catch (err: any) {
      console.log(chalk.red(`\n❌ Initialization failed: ${err.message}\n`));
      process.exit(1);
    }
  }
}