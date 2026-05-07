import chalk from 'chalk';
import { Command } from './command';
import { readFileSync, existsSync } from 'fs';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

export class Config implements Command {
  name = 'config';
  description = 'Show current HireAHuman configuration';

  async run(args: string[]): Promise<void> {
    console.log(W('\n⚙️  HireAHuman Config\n'));
    printMiniBanner('config');

    const showAll = args.includes('--all') || args.includes('-a');

    if (!existsSync('.env')) {
      console.log(D('⚠️  No .env file found. Run "hireahuman init" first.\n'));
      return;
    }

    const env = readFileSync('.env', 'utf-8');
    const lines = env.split('\n').filter((l) => l.includes('=') && !l.startsWith('#'));

    const config: Record<string, string> = {};
    for (const line of lines) {
      const eqIndex = line.indexOf('=');
      if (eqIndex === -1) continue;
      const key = line.slice(0, eqIndex).trim();
      const val = line.slice(eqIndex + 1).trim();
      config[key] = val;
    }

    const sensitive = ['SUPABASE_SERVICE_ROLE_KEY', 'STRIPE_SECRET_KEY', 'PAYPAL_SECRET', 'NOTIFY_EMAIL_PASS', 'NOTIFY_SMS_AUTH_TOKEN'];
    const masked: Record<string, string> = {};
    for (const [key, val] of Object.entries(config)) {
      if (sensitive.includes(key) && val) {
        masked[key] = val.slice(0, 4) + '****' + val.slice(-4);
      } else {
        masked[key] = val || '(not set)';
      }
    }

    console.log(W('Supabase:'));
    console.log(`  URL: ${D(masked.SUPABASE_URL || '(not set)')}`);
    console.log(`  Service Key: ${D(masked.SUPABASE_SERVICE_ROLE_KEY || '(not set)')}`);

    console.log(W('\nServer:'));
    console.log(`  Port: ${config.PORT || '3001'}`);
    console.log(`  API Port: ${config.API_PORT || '3000'}`);

    console.log(W('\nApps:'));
    console.log(`  Worker App: ${config.WORKER_APP_URL || 'http://localhost:3002'}`);
    console.log(`  Admin App: ${config.ADMIN_APP_URL || 'http://localhost:3003'}`);

    console.log(W('\nNotifications:'));
    console.log(`  Slack: ${config.NOTIFY_SLACK_WEBHOOK ? W('configured') : D('not set')}`);
    console.log(`  Telegram: ${config.NOTIFY_TELEGRAM_BOT_TOKEN ? W('configured') : D('not set')}`);
    console.log(`  Email: ${config.NOTIFY_EMAIL_HOST ? W('configured') : D('not set')}`);
    console.log(`  SMS: ${config.NOTIFY_SMS_PROVIDER ? W('configured') : D('not set')}`);

    console.log(W('\nPayments:'));
    console.log(`  Provider: ${config.PAYMENT_PROVIDER || 'none'}`);
    if (config.STRIPE_ACCOUNT_ID) console.log(`  Stripe: ${W(config.STRIPE_ACCOUNT_ID)}`);
    if (config.PAYPAL_CLIENT_ID) console.log(`  PayPal: ${W(config.PAYPAL_CLIENT_ID)}`);

    console.log('');
  }
}
