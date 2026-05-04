import axios from 'axios';
import type { NotificationPayload } from './manager';

export class SlackAdapter {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NOTIFY_SLACK_WEBHOOK || '';
  }

  async send(
    channelOrWebhook: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    const webhookUrl = channelOrWebhook.includes('hooks.slack.com')
      ? channelOrWebhook
      : this.webhookUrl;

    if (!webhookUrl) {
      console.warn('[notifications:slack] Slack webhook not configured — skipping notification');
      return { success: true };
    }

    const urgencyEmoji = payload.urgency === 'high' ? '🚨' : payload.urgency === 'medium' ? '⚡' : '💬';

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${urgencyEmoji} ${payload.title}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: payload.body,
        },
      },
    ];

    if (payload.bountyId) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Bounty ID:* \`${payload.bountyId}\``,
        },
      });
    }

    try {
      await axios.post(webhookUrl, { blocks });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
