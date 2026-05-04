import axios from 'axios';
import type { NotificationPayload } from './manager';

export class TelegramAdapter {
  private botToken: string;

  constructor() {
    this.botToken = process.env.NOTIFY_TELEGRAM_BOT_TOKEN || '';
  }

  async send(
    chatId: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      console.warn('[notifications:telegram] Telegram bot token not configured — skipping notification');
      return { success: true };
    }

    const urgencyEmoji = payload.urgency === 'high' ? '🚨' : payload.urgency === 'medium' ? '⚡' : '💬';
    const text = [
      `${urgencyEmoji} *${payload.title}*`,
      '',
      payload.body,
      '',
      payload.bountyId ? `\`Bounty: ${payload.bountyId}\`` : '',
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await axios.post(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
        }
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.description || err.message };
    }
  }
}
