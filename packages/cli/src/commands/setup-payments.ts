import * as chalk from 'chalk';
import { Command } from './command';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

export class SetupPayments implements Command {
  name = 'setup:payments';
  description = 'Configure payment provider (Stripe, PayPal, or Manual)';

  async run(args: string[]): Promise<void> {
    console.log(W('\n💳 Payment Setup\n'));
    printMiniBanner('setup:payments');

    const inquirer = (await import('inquirer')).default;

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Which payment provider?',
        choices: [
          { name: '💳 Stripe (recommended)', value: 'stripe' },
          { name: '🅿️ PayPal', value: 'paypal' },
          { name: '✋ Manual (track payments yourself)', value: 'manual' },
          { name: '🚫 No payments (internal team only)', value: 'none' },
        ],
        default: 'stripe',
      },
    ]);

    const config: any = { provider: answers.provider };

    if (answers.provider === 'stripe') {
      const stripeAns = await inquirer.prompt([
        {
          type: 'input',
          name: 'accountId',
          message: 'Stripe Account ID (acct_...):',
          validate: (input: string) => {
            if (!input.startsWith('acct_')) return 'Must start with acct_';
            return true;
          },
        },
        {
          type: 'input',
          name: 'secretKey',
          message: 'Stripe Secret Key (sk_live_...):',
        },
        {
          type: 'input',
          name: 'webhookSecret',
          message: 'Stripe Webhook Secret (whsec_...):',
        },
      ]);
      config.stripe = {
        accountId: stripeAns.accountId,
        secretKey: stripeAns.secretKey,
        webhookSecret: stripeAns.webhookSecret,
      };
    } else if (answers.provider === 'paypal') {
      const ppAns = await inquirer.prompt([
        {
          type: 'input',
          name: 'clientId',
          message: 'PayPal Client ID:',
        },
        {
          type: 'password',
          name: 'secret',
          message: 'PayPal Secret:',
        },
        {
          type: 'list',
          name: 'mode',
          message: 'PayPal Mode:',
          choices: ['live', 'sandbox'],
          default: 'sandbox',
        },
      ]);
      config.paypal = {
        clientId: ppAns.clientId,
        secret: ppAns.secret,
        mode: ppAns.mode,
      };
    }

    let envContent = existsSync('.env') ? readFileSync('.env', 'utf-8') : '';

    const paymentLines: string[] = [`\n# Payment Configuration`, `PAYMENT_PROVIDER=${answers.provider}`];

    if (config.stripe) {
      paymentLines.push(`STRIPE_ACCOUNT_ID=${config.stripe.accountId}`);
      paymentLines.push(`STRIPE_SECRET_KEY=${config.stripe.secretKey}`);
      paymentLines.push(`STRIPE_WEBHOOK_SECRET=${config.stripe.webhookSecret}`);
    }
    if (config.paypal) {
      paymentLines.push(`PAYPAL_CLIENT_ID=${config.paypal.clientId}`);
      paymentLines.push(`PAYPAL_SECRET=${config.paypal.secret}`);
      paymentLines.push(`PAYPAL_MODE=${config.paypal.mode}`);
    }

    if (!envContent.includes('PAYMENT_PROVIDER')) {
      envContent += paymentLines.join('\n');
    }

    writeFileSync('.env', envContent);
    writeFileSync('payments-config.json', JSON.stringify(config, null, 2));

    console.log(W('\n✅ Payment provider configured!\n'));
    console.log(D(`Provider: ${answers.provider}`));
    if (answers.provider === 'stripe') console.log(D(`Account: ${config.stripe.accountId}`));
    console.log('');
  }
}
