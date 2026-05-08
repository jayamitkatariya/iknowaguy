import Stripe from "stripe";

type Currency = "USD" | "EUR" | "GBP" | "INR";

const STRIPE_API_VERSION = "2025-02-24.acacia";

const isStubMode = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "dummy" || process.env.PAYMENT_PROVIDER === "none";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
      apiVersion: STRIPE_API_VERSION,
    });
  }
  return stripeInstance;
}

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

  const paymentIntent = await getStripe().paymentIntents.create({
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

  const paymentIntent = await getStripe().paymentIntents.capture(paymentIntentId);
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

  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: transactionId,
  };

  if (amount != null) {
    refundParams.amount = Math.round(amount * 100); // Convert to cents
  }

  const refund = await getStripe().refunds.create(refundParams);
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
  const event = getStripe().webhooks.constructEvent(body, signature, secret);
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

  return getStripe().paymentIntents.retrieve(paymentIntentId);
}

// ─── Stripe Connect ───────────────────────────────────────────────────────────

export async function createConnectAccount(
  email: string,
  metadata: Record<string, string> = {}
): Promise<Stripe.Account | { id: string; email: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] createConnectAccount called in stub mode");
    return {
      id: `acct_stub_${Date.now().toString(36)}`,
      email,
    };
  }

  const account = await getStripe().accounts.create({
    type: "express",
    email,
    metadata,
    capabilities: {
      transfers: { requested: true },
    },
  });

  return account;
}

export async function createAccountLink(
  accountId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<Stripe.AccountLink | { url: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] createAccountLink called in stub mode for:", accountId);
    return {
      url: `${returnUrl}?account_id=${accountId}&stub=true`,
    };
  }

  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });

  return accountLink;
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  currency: Currency = "USD",
  metadata: Record<string, string> = {}
): Promise<Stripe.Transfer | { id: string; amount: number; destination: string }> {
  if (isStubMode) {
    console.log("[stripe:stub] createTransfer called in stub mode");
    return {
      id: `tr_stub_${Date.now().toString(36)}`,
      amount: Math.round(amount * 100),
      destination: destinationAccountId,
    };
  }

  const transfer = await getStripe().transfers.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    destination: destinationAccountId,
    metadata,
  });

  return transfer;
}

export async function getAccountStatus(
  accountId: string
): Promise<{ id: string; charges_enabled: boolean; payouts_enabled: boolean; details_submitted: boolean }> {
  if (isStubMode) {
    return {
      id: accountId,
      charges_enabled: true,
      payouts_enabled: true,
      details_submitted: true,
    };
  }

  const account = await getStripe().accounts.retrieve(accountId);

  return {
    id: account.id,
    charges_enabled: account.charges_enabled ?? false,
    payouts_enabled: account.payouts_enabled ?? false,
    details_submitted: account.details_submitted ?? false,
  };
}



