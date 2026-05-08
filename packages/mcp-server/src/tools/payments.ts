import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";
import { sseEmitter } from "../lib/sse.js";
import {
  createPaymentIntent,
  capturePayment,
  refundPayment,
  getPaymentIntentStatus,
  createConnectAccount,
  createAccountLink,
  createTransfer,
  getAccountStatus,
} from "../lib/stripe.js";

export const PaymentInitiateSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty"),
  amount: z.number().positive().describe("Payment amount"),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD"),
});

export const PaymentStatusSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty"),
});

export const PaymentReleaseSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty"),
});

export const PaymentRefundSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty"),
  reason: z.string().optional().describe("Reason for refund"),
});

export const CreateConnectAccountSchema = z.object({
  human_id: z.string().describe("ID of the human worker"),
  email: z.string().email().describe("Email for the Stripe Connect account"),
});

export const GetAccountLinkSchema = z.object({
  human_id: z.string().describe("ID of the human worker"),
  refresh_url: z.string().url().describe("URL to redirect to if the link expires"),
  return_url: z.string().url().describe("URL to redirect to after completing onboarding"),
});

export const TransferSchema = z.object({
  bounty_id: z.string().describe("ID of the bounty for the transfer"),
  amount: z.number().positive().describe("Amount to transfer"),
  currency: z.enum(["USD", "EUR", "GBP", "INR"]).optional().default("USD"),
});

export async function handleInitiatePayment(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, reward_amount, payment_status")
    .eq("id", args.bounty_id)
    .eq("tenant_id", tenantId)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  const paymentIntent = await createPaymentIntent(
    args.amount,
    args.currency,
    {
      bounty_id: args.bounty_id,
      tenant_id: tenantId,
    }
  );

  const stripePaymentIntentId = paymentIntent.id;

  // Insert payment transaction record
const { error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        bounty_id: args.bounty_id,
        tenant_id: tenantId,
        stripe_payment_intent_id: stripePaymentIntentId,
        amount: args.amount,
        currency: args.currency,
        type: "hold",
        status: "pending",
        created_at: new Date().toISOString(),
      });

  if (txError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: txError.message }) }],
    };
  }

  // Update bounty payment_status to escrowed
  const { error: updateError } = await supabase
    .from("bounties")
    .update({
      payment_status: "held",
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.bounty_id);

  if (updateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: updateError.message }) }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            payment_intent_id: stripePaymentIntentId,
            bounty_id: args.bounty_id,
            amount: args.amount,
            currency: args.currency,
            status: "held",
            message: "Payment initiated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetPaymentStatus(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, payment_status, reward_amount, currency")
    .eq("id", args.bounty_id)
    .eq("tenant_id", tenantId)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  // Query payment_transactions for this bounty
const { data: tx, error: txError } = await supabase
      .from("payment_transactions")
      .select("stripe_payment_intent_id, status")
      .eq("bounty_id", args.bounty_id)
      .maybeSingle();

  let stripeStatus = null;
  if (tx && tx.stripe_payment_intent_id) {
    const intentStatus = await getPaymentIntentStatus(tx.stripe_payment_intent_id);
    stripeStatus = intentStatus.status;
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            bounty_id: bounty.id,
            payment_status: bounty.payment_status,
            transaction_status: tx?.status ?? null,
            stripe_status: stripeStatus,
            amount: bounty.reward_amount,
            currency: bounty.currency,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleReleasePayment(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  // Fetch bounty WITH assigned_human_id
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, assigned_human_id, reward_amount, currency, payment_status")
    .eq("id", args.bounty_id)
    .eq("tenant_id", tenantId)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  if (!bounty.assigned_human_id) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty has no assigned worker" }) }],
    };
  }

  // Fetch worker's Stripe Connect account
  const { data: profile, error: profileError } = await supabase
    .from("human_profiles")
    .select("stripe_account_id, stripe_onboarding_complete")
    .eq("id", bounty.assigned_human_id)
    .single();

  if (profileError || !profile?.stripe_account_id) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Worker has not set up Stripe Connect account" }) }],
    };
  }

  // Get the payment transaction for this bounty
  const { data: tx, error: txError } = await supabase
    .from("payment_transactions")
    .select("id, stripe_payment_intent_id")
    .eq("bounty_id", args.bounty_id)
    .maybeSingle();

  if (txError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: txError.message }) }],
    };
  }

  if (!tx || !tx.stripe_payment_intent_id) {
    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ error: "No payment transaction found for this bounty" }) },
      ],
    };
  }

  // Capture the payment (move from escrow to captured)
  const captureResult = await capturePayment(tx.stripe_payment_intent_id);

  // Transfer to worker's Stripe Connect account
  const transfer = await createTransfer(
    bounty.reward_amount,
    profile.stripe_account_id,
    bounty.currency as "USD" | "EUR" | "GBP" | "INR",
    { bounty_id: args.bounty_id, worker_id: bounty.assigned_human_id }
  );

  const transferResult = transfer as { id: string; amount: number; destination: string };

  // Update payment_transactions: captured + transfer record
  await supabase
    .from("payment_transactions")
    .update({
      status: "completed",
      metadata: { transfer_id: transferResult.id },
      updated_at: new Date().toISOString(),
    })
    .eq("id", tx.id);

  // Update bounty payment_status to released
  await supabase
    .from("bounties")
    .update({
      payment_status: "released",
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.bounty_id);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            bounty_id: args.bounty_id,
            payment_status: "released",
            transfer_id: transferResult.id,
            transfer_amount: transferResult.amount / 100,
            transferred_to: transferResult.destination,
            message: "Payment released and transferred to worker",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleRefundPayment(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, payment_status")
    .eq("id", args.bounty_id)
    .eq("tenant_id", tenantId)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  // Get the payment transaction for this bounty
const { data: tx, error: txError } = await supabase
      .from("payment_transactions")
      .select("stripe_payment_intent_id")
      .eq("bounty_id", args.bounty_id)
      .maybeSingle();

  if (txError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: txError.message }) }],
    };
  }

  if (!tx || !tx.stripe_payment_intent_id) {
    return {
      content: [
        { type: "text" as const, text: JSON.stringify({ error: "No payment transaction found for this bounty" }) },
      ],
    };
  }

  // Refund the payment
  await refundPayment(tx.stripe_payment_intent_id);

  // Update payment_transactions status to refunded
  const { error: txUpdateError } = await supabase
      .from("payment_transactions")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("bounty_id", args.bounty_id)
      .eq("tenant_id", tenantId);

  if (txUpdateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: txUpdateError.message }) }],
    };
  }

  // Update bounty payment_status to refunded
  const { error: updateError } = await supabase
    .from("bounties")
    .update({
      payment_status: "refunded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", args.bounty_id)
    .eq("tenant_id", tenantId);

  if (updateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: updateError.message }) }],
    };
  }

  // Broadcast SSE event
  sseEmitter.broadcast("bounty.refunded", tenantId, { bounty_id: args.bounty_id, reason: args.reason ?? null });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            bounty_id: args.bounty_id,
            payment_status: "refunded",
            reason: args.reason ?? null,
            message: "Payment refunded successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleConnectAccount(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  // Check if user exists and is a human
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", args.human_id)
    .single();

  if (userError || !user) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Human user not found" }) }],
    };
  }

  if (user.role !== "human") {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "User is not a human worker" }) }],
    };
  }

  // Check if already has a stripe_account_id
  const { data: profile, error: profileError } = await supabase
    .from("human_profiles")
    .select("stripe_account_id")
    .eq("id", args.human_id)
    .maybeSingle();

  if (profileError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: profileError.message }) }],
    };
  }

  // If already has an account, return existing info
  if (profile?.stripe_account_id) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              stripe_account_id: profile.stripe_account_id,
              message: "Worker already has a Stripe Connect account",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Create a new Stripe Connect account
  const account = await createConnectAccount(args.email, {
    human_id: args.human_id,
  });

  const accountId = account.id;

  // Save stripe_account_id to human_profiles
  const { error: updateError } = await supabase
    .from("human_profiles")
    .update({ stripe_account_id: accountId })
    .eq("id", args.human_id);

  if (updateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: updateError.message }) }],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            stripe_account_id: accountId,
            email: args.email,
            message: "Stripe Connect account created successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetAccountLink(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  // Get human profile with stripe_account_id
  const { data: profile, error: profileError } = await supabase
    .from("human_profiles")
    .select("stripe_account_id")
    .eq("id", args.human_id)
    .single();

  if (profileError || !profile) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Human profile not found" }) }],
    };
  }

  if (!profile.stripe_account_id) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: "No Stripe Connect account found for this worker. Create one first." }),
        },
      ],
    };
  }

  const accountLink = await createAccountLink(
    profile.stripe_account_id,
    args.refresh_url,
    args.return_url
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            url: (accountLink as any).url,
            stripe_account_id: profile.stripe_account_id,
            expires_at: (accountLink as any).expires_at,
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleTransferToWorker(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  // Get the bounty
  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, assigned_human_id, reward_amount, currency")
    .eq("id", args.bounty_id)
    .single();

  if (bountyError || !bounty) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty not found" }) }],
    };
  }

  if (!bounty.assigned_human_id) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Bounty has no assigned worker" }) }],
    };
  }

  // Get worker's Stripe account
  const { data: profile, error: profileError } = await supabase
    .from("human_profiles")
    .select("stripe_account_id")
    .eq("id", bounty.assigned_human_id)
    .single();

  if (profileError || !profile) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: "Worker profile not found" }) }],
    };
  }

  if (!profile.stripe_account_id) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: "Worker has not set up their Stripe Connect account yet" }),
        },
      ],
    };
  }

  // Check account status
  const status = await getAccountStatus(profile.stripe_account_id);

  if (!status.details_submitted) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            error: "Worker has not completed Stripe onboarding",
            stripe_account_id: profile.stripe_account_id,
            charges_enabled: status.charges_enabled,
            payouts_enabled: status.payouts_enabled,
            details_submitted: status.details_submitted,
          }),
        },
      ],
    };
  }

  // Create the transfer
  const transfer = await createTransfer(
    args.amount,
    profile.stripe_account_id,
    args.currency,
    {
      bounty_id: args.bounty_id,
    }
  );

  const transferResult = transfer as any;

  // Record the payout in payment_transactions
  await supabase.from("payment_transactions").insert({
    bounty_id: args.bounty_id,
    human_id: bounty.assigned_human_id,
    amount: args.amount,
    currency: args.currency,
    type: "bounty_payment",
    status: "completed",
    metadata: { transfer_id: transferResult.id },
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            transfer_id: transferResult.id,
            amount: args.amount,
            currency: args.currency,
            destination: profile.stripe_account_id,
            bounty_id: args.bounty_id,
            message: "Transfer completed successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export function registerPaymentTools(server: McpServer) {
  server.tool(
    "initiate_payment",
    "Initiate a payment for a bounty",
    PaymentInitiateSchema.shape as any,
    async (args: any) => handleInitiatePayment(args, args.tenant_id ?? "")
  );

  server.tool(
    "get_payment_status",
    "Get the current payment status for a bounty",
    PaymentStatusSchema.shape as any,
    async (args: any) => handleGetPaymentStatus(args, args.tenant_id ?? "")
  );

  server.tool(
    "release_payment",
    "Release payment for a completed bounty",
    PaymentReleaseSchema.shape as any,
    async (args: any) => handleReleasePayment(args, args.tenant_id ?? "")
  );

  server.tool(
    "refund_payment",
    "Refund payment for a bounty",
    PaymentRefundSchema.shape as any,
    async (args: any) => handleRefundPayment(args, args.tenant_id ?? "")
  );

  server.tool(
    "create_connect_account",
    "Create a Stripe Connect express account for a human worker",
    CreateConnectAccountSchema.shape as any,
    async (args: any) => handleConnectAccount(args, args.tenant_id ?? "")
  );

  server.tool(
    "get_account_link",
    "Get a Stripe Connect onboarding link for a worker to complete their account setup",
    GetAccountLinkSchema.shape as any,
    async (args: any) => handleGetAccountLink(args, args.tenant_id ?? "")
  );

  server.tool(
    "transfer_to_worker",
    "Transfer payment to a worker's Stripe Connect account",
    TransferSchema.shape as any,
    async (args: any) => handleTransferToWorker(args, args.tenant_id ?? "")
  );
}
