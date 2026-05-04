import * as chalk from 'chalk';
import { Command } from './command';
import { existsSync, readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

export class Doctor implements Command {
  name = 'doctor';
  description = 'Diagnose HireAHuman setup issues';

  async run(args: string[]): Promise<void> {
    console.log(W('\n🩺 HireAHuman Doctor\n'));
    printMiniBanner('doctor');

    let passed = 0;
    let failed = 0;

    // Check .env
    const envOk = existsSync('.env');
    if (envOk) {
      console.log(W('✅ .env file exists'));
      passed++;
    } else {
      console.log(W('❌ .env file missing. Run "hireahuman init"'));
      failed++;
    }

    // Check hireahuman.config.ts
    const configOk = existsSync('hireahuman.config.ts');
    if (configOk) {
      console.log(W('✅ hireahuman.config.ts exists'));
      passed++;
    } else {
      console.log(D('⚠️  hireahuman.config.ts missing. Optional but recommended.'));
    }

    // Check hireahuman-mcp.json
    const mcpOk = existsSync('hireahuman-mcp.json');
    if (mcpOk) {
      console.log(W('✅ hireahuman-mcp.json exists'));
      passed++;
    } else {
      console.log(D('⚠️  hireahuman-mcp.json missing. Run "hireahuman setup:agent"'));
    }

    // Check Supabase connection
    if (envOk) {
      const env = readFileSync('.env', 'utf-8');
      const getVal = (k: string) => env.split('\n').find((l) => l.startsWith(k))?.split('=')[1]?.trim() || '';

      const supabaseUrl = getVal('SUPABASE_URL');
      const supabaseKey = getVal('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-project.supabase.co') {
        try {
          const supabase = createClient(supabaseUrl, supabaseKey);
          const { error } = await supabase.from('tenants').select('id').limit(1);
          if (error) throw error;
          console.log(W('✅ Supabase connection OK'));
          passed++;
        } catch (err: any) {
          console.log(W(`❌ Supabase connection failed: ${err.message}`));
          failed++;
        }
      } else {
        console.log(D('⚠️  Supabase not configured in .env'));
      }
    }

    // Check Node.js version
    const [major] = process.version.slice(1).split('.').map(Number);
    if (major >= 18) {
      console.log(W(`✅ Node.js ${process.version} (>=18)`));
      passed++;
    } else {
      console.log(W(`❌ Node.js ${process.version} (<18). Upgrade required.`));
      failed++;
    }

    console.log(W(`\n${W(`✅ ${passed} passed`)}${failed > 0 ? `, ${W(`${failed} failed`)}` : ''}\n`));

    if (failed > 0) {
      console.log(W('Run "hireahuman init" to fix most issues.\n'));
    }
  }
}
