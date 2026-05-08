import axios from "axios";
import { createTransport } from "nodemailer";
import { getSupabaseClient } from "./supabase.js";

// ─────────────────────────────────────────────────────────────
// Notification Payload & Target types
// ─────────────────────────────────────────────────────────────

export interface NotificationPayload {
  bountyId?: string;
  title: string;
  body: string;
  urgency?: "low" | "medium" | "high";
  data?: Record<string, any>;
}

export interface NotificationTarget {
  email?: string;
  slackHandle?: string;
  telegramChatId?: string;
  smsNumber?: string;
}

// ─────────────────────────────────────────────────────────────
// Adapters (copied from shared to avoid monorepo resolution issues)
// ─────────────────────────────────────────────────────────────

class SlackAdapter {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = process.env.NOTIFY_SLACK_WEBHOOK || "";
  }

  async send(
    channelOrWebhook: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    const webhookUrl = channelOrWebhook.includes("hooks.slack.com")
      ? channelOrWebhook
      : this.webhookUrl;

    if (!webhookUrl) {
      console.warn("[notifications:slack] Slack webhook not configured — skipping notification");
      return { success: true };
    }

    const urgencyEmoji = payload.urgency === "high" ? "🚨" : payload.urgency === "medium" ? "⚡" : "💬";

    const blocks = [
      {
        type: "header",
        text: { type: "plain_text", text: `${urgencyEmoji} ${payload.title}` },
      },
      { type: "section", text: { type: "mrkdwn", text: payload.body } },
    ];

    if (payload.bountyId) {
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*Bounty ID:* \`${payload.bountyId}\`` },
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

class TelegramAdapter {
  private botToken: string;

  constructor() {
    this.botToken = process.env.NOTIFY_TELEGRAM_BOT_TOKEN || "";
  }

  async send(
    chatId: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      console.warn("[notifications:telegram] Telegram bot token not configured — skipping notification");
      return { success: true };
    }

    const urgencyEmoji = payload.urgency === "high" ? "🚨" : payload.urgency === "medium" ? "⚡" : "💬";
    const text = [
      `${urgencyEmoji} *${payload.title}*`,
      "",
      payload.body,
      "",
      payload.bountyId ? `\`Bounty: ${payload.bountyId}\`` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.response?.data?.description || err.message };
    }
  }
}

class EmailAdapter {
  private host: string;
  private port: number;
  private secure: boolean;
  private user: string | undefined;
  private pass: string | undefined;
  private from: string;

  constructor() {
    this.host = process.env.NOTIFY_EMAIL_HOST || "smtp.gmail.com";
    this.port = parseInt(process.env.NOTIFY_EMAIL_PORT || "587");
    this.secure = process.env.NOTIFY_EMAIL_PORT === "465";
    this.user = process.env.NOTIFY_EMAIL_USER;
    this.pass = process.env.NOTIFY_EMAIL_PASS;
    this.from = process.env.NOTIFY_EMAIL_FROM || "iknowaguy <noreply@iknowaguy-app.vercel.app>";
  }

  async send(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.user || !this.pass) {
      console.warn("[notifications:email] Email credentials not configured — skipping notification");
      return { success: true };
    }

    const transporter = createTransport({
      host: this.host,
      port: this.port,
      secure: this.secure,
      auth: { user: this.user, pass: this.pass },
    });

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #6366f1; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 20px;">iknowaguy</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2 style="color: #111827; margin-top: 0;">${payload.title}</h2>
          <p style="color: #374151; line-height: 1.6;">${payload.body.replace(/\n/g, "<br>")}</p>
          ${payload.bountyId ? `<p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Bounty ID: ${payload.bountyId}</p>` : ""}
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: this.from,
        to,
        subject: `[iknowaguy] ${payload.title}`,
        html,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

class SmsAdapter {
  private provider: string;
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private from: string | undefined;

  constructor() {
    this.provider = process.env.NOTIFY_SMS_PROVIDER || "twilio";
    this.accountSid = process.env.NOTIFY_SMS_ACCOUNT_SID;
    this.authToken = process.env.NOTIFY_SMS_AUTH_TOKEN;
    this.from = process.env.NOTIFY_SMS_FROM;
  }

  async send(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (this.provider === "twilio") {
      return this.sendTwilio(to, payload);
    }
    return { success: false, error: `SMS provider ${this.provider} not implemented` };
  }

  private async sendTwilio(
    to: string,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.accountSid || !this.authToken || !this.from) {
      console.warn("[notifications:sms] Twilio credentials not configured — skipping notification");
      return { success: true };
    }

    try {
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          To: to,
          From: this.from!,
          Body: `[iknowaguy] ${payload.title}: ${payload.body}`.slice(0, 160),
        }),
        { auth: { username: this.accountSid, password: this.authToken } }
      );
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Notification Manager
// ─────────────────────────────────────────────────────────────

export class NotificationManager {
  private slack = new SlackAdapter();
  private telegram = new TelegramAdapter();
  private email = new EmailAdapter();
  private sms = new SmsAdapter();

  async send(
    channel: "slack" | "telegram" | "email" | "sms",
    target: NotificationTarget,
    payload: NotificationPayload
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (channel) {
        case "slack":
          if (!target.slackHandle) return { success: false, error: "No Slack handle" };
          return await this.slack.send(target.slackHandle, payload);
        case "telegram":
          if (!target.telegramChatId) return { success: false, error: "No Telegram chat ID" };
          return await this.telegram.send(target.telegramChatId, payload);
        case "email":
          if (!target.email) return { success: false, error: "No email address" };
          return await this.email.send(target.email, payload);
        case "sms":
          if (!target.smsNumber) return { success: false, error: "No SMS number" };
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
    const channels = profile.notification_preferred_channels || ["email"];
    for (const channel of channels) {
      await this.send(channel as any, profile, payload);
    }
  }
}

export const notificationManager = new NotificationManager();

// ─────────────────────────────────────────────────────────────
// In-app notification helpers (writes to Supabase notifications table)
// ─────────────────────────────────────────────────────────────

async function createInAppNotification(
  userId: string,
  type: string,
  title: string,
  content: string,
  metadata?: Record<string, any>
) {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    content,
    metadata: metadata || {},
    is_read: false,
  });
  if (error) {
    console.warn("[notifications:in-app] Failed to create notification:", error.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Bounty Lifecycle Notifications
// ─────────────────────────────────────────────────────────────

/**
 * Notify matching workers when a new bounty is created.
 */
export async function notifyBountyCreated(bounty: any) {
  const supabase = getSupabaseClient();

  // Find matching workers based on skills / category
  let query = supabase
    .from("human_profiles")
    .select("id, full_name, email, skills, notification_preferred_channels, notification_slack, notification_telegram, notification_phone")
    .eq("is_available", true)
    .eq("verification_status", "verified");

  // If bounty has a category, try to match workers whose skills overlap with category name
  if (bounty.category_id) {
    const { data: category } = await supabase
      .from("categories")
      .select("name")
      .eq("id", bounty.category_id)
      .single();

    if (category?.name) {
      // Use overlaps for array containment: skills array contains category name
      query = query.contains("skills", [category.name.toLowerCase()]);
    }
  }

  const { data: workers, error } = await query;
  if (error || !workers || workers.length === 0) {
    console.log("[notifications:bounty-created] No matching workers found");
    return;
  }

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "New Bounty Available",
    body: `"${bounty.title}" — ${bounty.description?.slice(0, 120) || ""}\nReward: $${bounty.reward_amount} ${bounty.currency || "USD"}`,
    urgency: "medium",
  };

  for (const worker of workers) {
    // Send external notification
    await notificationManager.sendToProfile(
      {
        email: worker.email,
        slackHandle: worker.notification_slack,
        telegramChatId: worker.notification_telegram,
        smsNumber: worker.notification_phone,
        notification_preferred_channels: worker.notification_preferred_channels,
      },
      payload
    );

    // Create in-app notification
    await createInAppNotification(
      worker.id,
      "task_assigned",
      payload.title,
      payload.body,
      { bounty_id: bounty.id }
    );
  }

  console.log(`[notifications:bounty-created] Notified ${workers.length} matching workers`);
}

/**
 * Notify the agent / tenant when a bounty is accepted.
 */
export async function notifyBountyAccepted(bounty: any, workerId: string) {
  const supabase = getSupabaseClient();

  // Get worker details
  const { data: worker } = await supabase
    .from("human_profiles")
    .select("full_name, email")
    .eq("id", workerId)
    .single();

  // Get tenant contact email
  const { data: tenant } = await supabase
    .from("tenants")
    .select("contact_email, name")
    .eq("id", bounty.tenant_id)
    .single();

  if (!tenant?.contact_email) {
    console.log("[notifications:bounty-accepted] No tenant contact email configured");
    return;
  }

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "Bounty Accepted",
    body: `"${bounty.title}" has been accepted by ${worker?.full_name || "a worker"}.`,
    urgency: "medium",
  };

  await notificationManager.send("email", { email: tenant.contact_email }, payload);

  // Create in-app notification for the agent (look up agent user from users table)
  const { data: agentUsers } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", bounty.tenant_id)
    .eq("role", "agent");

  if (agentUsers) {
    for (const agent of agentUsers) {
      await createInAppNotification(agent.id, "task_assigned", payload.title, payload.body, {
        bounty_id: bounty.id,
      });
    }
  }
}

/**
 * Notify the agent / tenant when a bounty is submitted for review.
 */
export async function notifyBountySubmitted(bounty: any, submission: any) {
  const supabase = getSupabaseClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("contact_email, name")
    .eq("id", bounty.tenant_id)
    .single();

  if (!tenant?.contact_email) {
    console.log("[notifications:bounty-submitted] No tenant contact email configured");
    return;
  }

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "Bounty Submitted for Review",
    body: `"${bounty.title}" has been submitted and is awaiting your review.\n${submission.content ? "Notes: " + submission.content.slice(0, 200) : ""}`,
    urgency: "high",
  };

  await notificationManager.send("email", { email: tenant.contact_email }, payload);

  // In-app notifications for agents
  const { data: agentUsers } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", bounty.tenant_id)
    .eq("role", "agent");

  if (agentUsers) {
    for (const agent of agentUsers) {
      await createInAppNotification(agent.id, "submission_reviewed", payload.title, payload.body, {
        bounty_id: bounty.id,
      });
    }
  }
}

/**
 * Notify the worker when their bounty is approved.
 */
export async function notifyBountyApproved(bounty: any, workerId: string) {
  const supabase = getSupabaseClient();

  const { data: worker } = await supabase
    .from("human_profiles")
    .select("full_name, email, notification_preferred_channels, notification_slack, notification_telegram, notification_phone")
    .eq("id", workerId)
    .single();

  if (!worker) return;

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "Bounty Approved 🎉",
    body: `Great news! Your work on "${bounty.title}" has been approved.\nReward: $${bounty.reward_amount} ${bounty.currency || "USD"}`,
    urgency: "high",
  };

  await notificationManager.sendToProfile(
    {
      email: worker.email,
      slackHandle: worker.notification_slack,
      telegramChatId: worker.notification_telegram,
      smsNumber: worker.notification_phone,
      notification_preferred_channels: worker.notification_preferred_channels,
    },
    payload
  );

  await createInAppNotification(workerId, "submission_reviewed", payload.title, payload.body, {
    bounty_id: bounty.id,
    amount: bounty.reward_amount,
  });
}

/**
 * Notify the worker when their bounty is rejected.
 */
export async function notifyBountyRejected(bounty: any, workerId: string, notes?: string) {
  const supabase = getSupabaseClient();

  const { data: worker } = await supabase
    .from("human_profiles")
    .select("full_name, email, notification_preferred_channels, notification_slack, notification_telegram, notification_phone")
    .eq("id", workerId)
    .single();

  if (!worker) return;

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "Bounty Reviewed — Needs Revision",
    body: `Your submission for "${bounty.title}" was not approved.${notes ? "\nFeedback: " + notes : ""}\nThe bounty is now open again for resubmission.`,
    urgency: "high",
  };

  await notificationManager.sendToProfile(
    {
      email: worker.email,
      slackHandle: worker.notification_slack,
      telegramChatId: worker.notification_telegram,
      smsNumber: worker.notification_phone,
      notification_preferred_channels: worker.notification_preferred_channels,
    },
    payload
  );

  await createInAppNotification(workerId, "submission_reviewed", payload.title, payload.body, {
    bounty_id: bounty.id,
  });
}

export async function notifyDisputeRaised(dispute: any, bounty: any) {
  const supabase = getSupabaseClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("contact_email, name")
    .eq("id", bounty.tenant_id)
    .single();

  const payload: NotificationPayload = {
    bountyId: bounty.id,
    title: "Dispute Raised",
    body: `A dispute has been raised on bounty "${bounty.title}".\nReason: ${dispute.reason}`,
    urgency: "high",
  };

  if (tenant?.contact_email) {
    await notificationManager.send("email", { email: tenant.contact_email }, payload);
  }

  const { data: agentUsers } = await supabase
    .from("users")
    .select("id")
    .eq("tenant_id", bounty.tenant_id)
    .eq("role", "agent");

  if (agentUsers) {
    for (const agent of agentUsers) {
      await createInAppNotification(agent.id, "dispute_raised", payload.title, payload.body, {
        bounty_id: bounty.id,
        dispute_id: dispute.id,
      });
    }
  }

  if (bounty.assigned_human_id) {
    await createInAppNotification(bounty.assigned_human_id, "dispute_raised", payload.title, payload.body, {
      bounty_id: bounty.id,
      dispute_id: dispute.id,
    });
  }
}
