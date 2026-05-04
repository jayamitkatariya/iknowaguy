import { SlackAdapter } from './slack';
import { TelegramAdapter } from './telegram';
import { EmailAdapter } from './email';
import { SmsAdapter } from './sms';

export interface NotificationPayload {
  bountyId?: string;
  title: string;
  body: string;
  urgency?: 'low' | 'medium' | 'high';
  data?: Record<string, any>;
}

export interface NotificationTarget {
  email?: string;
  slackHandle?: string;
  telegramChatId?: string;
  smsNumber?: string;
}

export class NotificationManager {
  private slack: SlackAdapter;
  private telegram: TelegramAdapter;
  private email: EmailAdapter;
  private sms: SmsAdapter;

  constructor() {
    this.slack = new SlackAdapter();
    this.telegram = new TelegramAdapter();
    this.email = new EmailAdapter();
    this.sms = new SmsAdapter();
  }

  async send(
    channel: 'slack' | 'telegram' | 'email' | 'sms',
    target: NotificationTarget,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (channel) {
        case 'slack':
          if (!target.slackHandle) return { success: false, error: 'No Slack handle' };
          return await this.slack.send(target.slackHandle, payload);
        case 'telegram':
          if (!target.telegramChatId) return { success: false, error: 'No Telegram chat ID' };
          return await this.telegram.send(target.telegramChatId, payload);
        case 'email':
          if (!target.email) return { success: false, error: 'No email address' };
          return await this.email.send(target.email, payload);
        case 'sms':
          if (!target.smsNumber) return { success: false, error: 'No SMS number' };
          return await this.sms.send(target.smsNumber, payload);
        default:
          return { success: false, error: `Unknown channel: ${channel}` };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async sendToProfile(
    profile: NotificationTarget & { notification_preferred_channels?: string[] },
    payload: NotificationPayload
  ): Promise<void> {
    const channels = profile.notification_preferred_channels || ['email'];
    for (const channel of channels) {
      await this.send(channel as any, profile, payload);
    }
  }
}
