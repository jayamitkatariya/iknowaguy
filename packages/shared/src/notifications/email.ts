import { createTransport } from 'nodemailer';
import type { NotificationPayload } from './manager';

export class EmailAdapter {
  private host: string;
  private port: number;
  private secure: boolean;
  private user: string | undefined;
  private pass: string | undefined;
  private from: string;

  constructor() {
    this.host = process.env.NOTIFY_EMAIL_HOST || 'smtp.gmail.com';
    this.port = parseInt(process.env.NOTIFY_EMAIL_PORT || '587');
    this.secure = process.env.NOTIFY_EMAIL_PORT === '465';
    this.user = process.env.NOTIFY_EMAIL_USER;
    this.pass = process.env.NOTIFY_EMAIL_PASS;
    this.from = process.env.NOTIFY_EMAIL_FROM || 'HireAHuman <noreply@hireahuman.ai>';
  }

  async send(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    // Check if email is configured
    if (!this.user || !this.pass) {
      console.warn('[notifications:email] Email credentials not configured — skipping notification');
      return { success: true };
    }

    const transporter = createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: {
        user: this.user,
        pass: this.pass,
      },
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6366f1; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">HireAHuman</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #111827; margin-top: 0;">${payload.title}</h2>
          <p style="color: #374151; line-height: 1.6;">${payload.body.replace(/\\n/g, '<br>')}</p>
          ${payload.bountyId ? `<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Bounty ID: ${payload.bountyId}</p>` : ''}
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: this.from,
        to,
        subject: `[HireAHuman] ${payload.title}`,
        html,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}
