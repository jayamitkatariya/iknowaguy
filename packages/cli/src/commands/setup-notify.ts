import chalk from 'chalk';
import { Command } from './command';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { printMiniBanner } from '../lib/ascii';

const W = chalk.white.bold;
const D = chalk.white.dim;

export class SetupNotify implements Command {
  name = 'setup:notify';
  description = 'Configure notification channels (Slack, Telegram, Email, SMS)';

  async run(args: string[]): Promise<void> {
    console.log(W('\n📬 Notification Setup\n'));
    printMiniBanner('setup:notify');

    const inquirer = (await import('inquirer')).default;

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'channels',
        message: 'Which notification channels do you want to enable?',
        choices: [
          { name: '📧 Email (SMTP)', value: 'email' },
          { name: '💬 Slack', value: 'slack' },
          { name: '✈️ Telegram', value: 'telegram' },
          { name: '📱 SMS (Twilio)', value: 'sms' },
        ],
        default: ['email'],
      },
    ]);

    const config: any = {};

    if (answers.channels.includes('email')) {
      const emailAns = await inquirer.prompt([
        {
          type: 'input',
          name: 'smtpHost',
          message: 'SMTP Host (e.g., smtp.gmail.com):',
          default: 'smtp.gmail.com',
        },
        {
          type: 'input',
          name: 'smtpPort',
          message: 'SMTP Port:',
          default: '587',
        },
        {
          type: 'input',
          name: 'smtpUser',
          message: 'SMTP Username:',
        },
        {
          type: 'password',
          name: 'smtpPass',
          message: 'SMTP Password:',
        },
        {
          type: 'input',
          name: 'fromEmail',
          message: 'From Email (e.g., notifications@yourdomain.com):',
        },
      ]);
      config.email = {
        provider: 'smtp',
        host: emailAns.smtpHost,
        port: parseInt(emailAns.smtpPort),
        user: emailAns.smtpUser,
        pass: emailAns.smtpPass,
        from: emailAns.fromEmail,
      };
    }

    if (answers.channels.includes('slack')) {
      const slackAns = await inquirer.prompt([
        {
          type: 'input',
          name: 'webhookUrl',
          message: 'Slack Webhook URL:',
          validate: (input: string) => {
            if (!input.includes('hooks.slack.com')) return 'Must be a valid Slack webhook URL';
            return true;
          },
        },
        {
          type: 'input',
          name: 'channel',
          message: 'Default Slack Channel (e.g., #human-tasks):',
          default: '#human-tasks',
        },
      ]);
      config.slack = {
        webhookUrl: slackAns.webhookUrl,
        defaultChannel: slackAns.channel,
      };
    }

    if (answers.channels.includes('telegram')) {
      const teleAns = await inquirer.prompt([
        {
          type: 'input',
          name: 'botToken',
          message: 'Telegram Bot Token (from @BotFather):',
          validate: (input: string) => {
            if (!input.match(/^\d+:[A-Za-z0-9_-]+$/)) return 'Must be a valid Telegram bot token';
            return true;
          },
        },
        {
          type: 'input',
          name: 'chatId',
          message: 'Default Chat ID (or leave blank to setup via bot):',
          default: '',
        },
      ]);
      config.telegram = {
        botToken: teleAns.botToken,
        defaultChatId: teleAns.chatId,
      };
    }

    if (answers.channels.includes('sms')) {
      const smsAns = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'SMS Provider:',
          choices: ['twilio', 'vonage', 'textlocal'],
          default: 'twilio',
        },
        {
          type: 'input',
          name: 'accountSid',
          message: 'Account SID / API Key:',
        },
        {
          type: 'password',
          name: 'authToken',
          message: 'Auth Token:',
        },
        {
          type: 'input',
          name: 'fromNumber',
          message: 'From Phone Number:',
        },
      ]);
      config.sms = {
        provider: smsAns.provider,
        accountSid: smsAns.accountSid,
        authToken: smsAns.authToken,
        from: smsAns.fromNumber,
      };
    }

    let envContent = '';
    if (existsSync('.env')) {
      envContent = readFileSync('.env', 'utf-8');
    }

    const notifyLines = ['\n# Notification Configuration'];
    if (config.email) {
      notifyLines.push(`NOTIFY_EMAIL_HOST=${config.email.host}`);
      notifyLines.push(`NOTIFY_EMAIL_PORT=${config.email.port}`);
      notifyLines.push(`NOTIFY_EMAIL_USER=${config.email.user}`);
      notifyLines.push(`NOTIFY_EMAIL_PASS=${config.email.pass}`);
      notifyLines.push(`NOTIFY_EMAIL_FROM=${config.email.from}`);
    }
    if (config.slack) {
      notifyLines.push(`NOTIFY_SLACK_WEBHOOK=${config.slack.webhookUrl}`);
      notifyLines.push(`NOTIFY_SLACK_CHANNEL=${config.slack.defaultChannel}`);
    }
    if (config.telegram) {
      notifyLines.push(`NOTIFY_TELEGRAM_BOT_TOKEN=${config.telegram.botToken}`);
      notifyLines.push(`NOTIFY_TELEGRAM_CHAT_ID=${config.telegram.defaultChatId}`);
    }
    if (config.sms) {
      notifyLines.push(`NOTIFY_SMS_PROVIDER=${config.sms.provider}`);
      notifyLines.push(`NOTIFY_SMS_ACCOUNT_SID=${config.sms.accountSid}`);
      notifyLines.push(`NOTIFY_SMS_AUTH_TOKEN=${config.sms.authToken}`);
      notifyLines.push(`NOTIFY_SMS_FROM=${config.sms.from}`);
    }

    if (!envContent.includes('NOTIFY_')) {
      envContent += notifyLines.join('\n');
    }

    writeFileSync('.env', envContent);
    writeFileSync('notifications-config.json', JSON.stringify(config, null, 2));

    console.log(W('\n✅ Notification channels configured!\n'));
    console.log(D('Your workers will now receive notifications via:'));
    for (const ch of answers.channels) {
      console.log(D(`  • ${ch}`));
    }
    console.log('');
  }
}
