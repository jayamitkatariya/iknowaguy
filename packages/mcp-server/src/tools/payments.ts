import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getSupabaseClient } from "../lib/supabase.js";
import {
  createPaymentIntent,
  capturePayment,
  refundPayment,
  getPaymentIntentStatus,
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

export async function handleInitiatePayment(args: any, tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, reward_amount, payment_status")
    .eq("id", args.bounty_id)
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
      payment_status: "escrowed",
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
            status: "escrowed",
            message: "Payment initiated successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleGetPaymentStatus(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, payment_status, reward_amount, currency")
    .eq("id", args.bounty_id)
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

export async function handleReleasePayment(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, payment_status")
    .eq("id", args.bounty_id)
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

  // Capture the payment
  await capturePayment(tx.stripe_payment_intent_id);

  // Update payment_transactions status to captured
  const { error: txUpdateError } = await supabase
    .from("payment_transactions")
    .update({
      status: "captured",
      updated_at: new Date().toISOString(),
    })
    .eq("bounty_id", args.bounty_id);

  if (txUpdateError) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: txUpdateError.message }) }],
    };
  }

  // Update bounty payment_status to released
  const { error: updateError } = await supabase
    .from("bounties")
    .update({
      payment_status: "released",
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
            success: true,
            bounty_id: args.bounty_id,
            payment_status: "released",
            message: "Payment released successfully",
          },
          null,
          2
        ),
      },
    ],
  };
}

export async function handleRefundPayment(args: any, _tenantId: string) {
  const supabase = getSupabaseClient();

  const { data: bounty, error: bountyError } = await supabase
    .from("bounties")
    .select("id, payment_status")
    .eq("id", args.bounty_id)
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
      .eq("bounty_id", args.bounty_id);

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

export function registerPaymentTools(server: McpServer) {
  server.tool(
    "initiate_payment",
    "Initiate a payment for a bounty",
    PaymentInitiateSchema.shape,
    async (args: any) => handleInitiatePayment(args, args.tenant_id ?? "")
  );

  server.tool(
    "get_payment_status",
    "Get the current payment status for a bounty",
    PaymentStatusSchema.shape,
    async (args: any) => handleGetPaymentStatus(args, args.tenant_id ?? "")
  );

  server.tool(
    "release_payment",
    "Release payment for a completed bounty",
    PaymentReleaseSchema.shape,
    async (args: any) => handleReleasePayment(args, args.tenant_id ?? "")
  );

  server.tool(
    "refund_payment",
    "Refund payment for a bounty",
    PaymentRefundSchema.shape,
    async (args: any) => handleRefundPayment(args, args.tenant_id ?? "")
  );
}
