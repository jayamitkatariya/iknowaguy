import axios from 'axios';
import type { NotificationPayload } from './manager';

export class SmsAdapter {
  private provider: string;
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private from: string | undefined;

  constructor() {
    this.provider = process.env.NOTIFY_SMS_PROVIDER || 'twilio';
    this.accountSid = process.env.NOTIFY_SMS_ACCOUNT_SID;
    this.authToken = process.env.NOTIFY_SMS_AUTH_TOKEN;
    this.from = process.env.NOTIFY_SMS_FROM;
  }

  async send(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (this.provider === 'twilio') {
      return this.sendTwilio(to, payload);
    }

    return { success: false, error: `SMS provider ${this.provider} not implemented` };
  }

  private async sendTwilio(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    // Check if Twilio is configured
    if (!this.accountSid || !this.authToken || !this.from) {
      console.warn('[notifications:sms] Twilio credentials not configured — skipping notification');
      return { success: false, error: 'Adapter not configured' };
    }

    try {
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: this.from!,
          Body: `[iknowaguy] ${payload.title}: ${payload.body}`.slice(0, 160),
        }),
        {
          auth: { username: this.accountSid, password: this.authToken },
        }
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
