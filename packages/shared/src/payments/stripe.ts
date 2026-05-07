import Stripe from "stripe";
import { Currency } from "../types.js";

const isStubMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy" || process.env.PAYMENT_PROVIDER === "none";

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripe;
}

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

  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
    capture_method: "manual",
  });

  return paymentIntent;
}

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

  const stripe = getStripe();

  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

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

  const stripe = getStripe();

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: transactionId,
  };

  if (amount != null) {
    refundParams.amount = Math.round(amount * 100);
  }

  const refund = await stripe.refunds.create(refundParams);
  return refund;
}

export function constructWebhookEvent(
  body: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  if (isStubMode) {
    console.log("[stripe:stub] constructWebhookEvent called in stub mode");
    return {
      id: `evt_stub_${Date.now().toString(36)}`,
      object: "event",
      api_version: "2025-02-24.acacia",
      created: Math.floor(Date.now() / 1000),
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: `pi_stub_${Date.now().toString(36)}`,
          object: "payment_intent",
          amount: 0,
          status: "succeeded",
        } as any,
      },
      pending_webhooks: 0,
      request: { id: null, idempotency_key: null },
      livemode: false,
    } as Stripe.Event;
  }

  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(body, signature, secret);
  return event;
}

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

  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export function getPaymentStatus(paymentIntentId: string): string {
  if (isStubMode) {
    return "stub";
  }
  return "active";
}