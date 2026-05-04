import Stripe from "stripe";
import { Currency } from "../types.js";

const isStubMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy" || process.env.PAYMENT_PROVIDER === "none";

/**
 * Create a Stripe PaymentIntent for a bounty payment
 * Falls back to stub mode if STRIPE_SECRET_KEY is not configured
 */
export async function createPaymentIntent(
  amount: number,
  currency: Currency,
  metadata: Record<string, string> = {}
): Promise<Stripe.PaymentIntent | { id: string; status: string; amount: number }> {
  if (isStubMode) {
    console.log("[stripe:stub] createPaymentIntent called in stub mode");
    return {
      id: `pi_stub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      status: "requires_capture",
      amount: Math.round(amount * 100),
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method: "manual", // Hold payment until explicitly captured
  });

  return paymentIntent;
}

/**
 * Capture a held PaymentIntent to release payment to the worker
 * Falls back to stub mode if Stripe is not configured
 */
export async function capturePayment(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | { id: string; status: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] capturePayment called in stub mode for:", paymentIntentId);
    return {
      id: paymentIntentId,
      status: "succeeded",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
  });

  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

/**
 * Issue a partial or full refund for a payment
 * Falls back to stub mode if Stripe is not configured
 */
export async function refundPayment(
  transactionId: string,
  amount?: number
): Promise<Stripe.Refund | { id: string; status: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] refundPayment called in stub mode for:", transactionId);
    return {
      id: `re_stub_${Date.now().toString(36)}`,
      status: "succeeded",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
  });

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: transactionId,
  };

  if (amount != null) {
    refundParams.amount = Math.round(amount * 100); // Convert to cents
  }

  const refund = await stripe.refunds.create(refundParams);
  return refund;
}

/**
 * Construct and validate a Stripe webhook event
 */
export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
  });

  const event = stripe.webhooks.constructEvent(body, signature, secret);
  return event;
}

/**
 * Get the status of a PaymentIntent
 * Falls back to stub status if Stripe is not configured
 */
export async function getPaymentIntentStatus(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent | { id: string; status: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] getPaymentIntentStatus called in stub mode for:", paymentIntentId);
    return {
      id: paymentIntentId,
      status: "stub",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2025-02-24.acacia",
  });

  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Get payment status string (for compatibility with stub mode)
 */
export function getPaymentStatus(paymentIntentId: string): string {
  if (isStubMode) {
    return "stub";
  }
  return "active";
}
