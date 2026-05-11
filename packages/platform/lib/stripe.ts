let StripeClass: any = null;

async function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (StripeClass) return new StripeClass(process.env.STRIPE_SECRET_KEY);
  const stripe = await import("stripe");
  StripeClass = stripe.default;
  return new StripeClass(process.env.STRIPE_SECRET_KEY);
}

export function isStripeEnabled(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export async function createPaymentIntent(amount: number, currency: string, metadata: Record<string, string> = {}) {
  if (!isStripeEnabled()) {
    return { id: `pi_stub_${Date.now()}`, client_secret: null, status: "requires_capture", stub: true };
  }
  const stripe = await getStripe();
  return stripe!.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: currency.toLowerCase(),
    capture_method: "manual",
    metadata,
  });
}

export async function capturePayment(paymentIntentId: string) {
  if (!isStripeEnabled()) return { status: "succeeded", stub: true };
  const stripe = await getStripe();
  return stripe!.paymentIntents.capture(paymentIntentId);
}

export async function cancelOrRefundPayment(paymentIntentId: string) {
  if (!isStripeEnabled()) return { status: "canceled", stub: true };
  const stripe = await getStripe();
  try {
    return await stripe!.paymentIntents.cancel(paymentIntentId);
  } catch {
    return await stripe!.refunds.create({ payment_intent: paymentIntentId });
  }
}

export async function createConnectAccount(email: string, country: string = "US") {
  if (!isStripeEnabled()) {
    return { id: `acct_stub_${Date.now()}`, stub: true };
  }
  const stripe = await getStripe();
  return stripe!.accounts.create({
    type: "express",
    country,
    email,
    capabilities: { transfers: { requested: true } },
  });
}

export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  if (!isStripeEnabled()) {
    return { url: `https://connect.stripe.com/setup/e/${accountId}`, stub: true };
  }
  const stripe = await getStripe();
  return stripe!.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: "account_onboarding",
  });
}

export async function getAccountStatus(accountId: string) {
  if (!isStripeEnabled()) {
    return { charges_enabled: true, payouts_enabled: true, details_submitted: true, stub: true };
  }
  const stripe = await getStripe();
  return stripe!.accounts.retrieve(accountId);
}

export async function createTransfer(amount: number, currency: string, destination: string) {
  if (!isStripeEnabled()) {
    return { id: `tr_stub_${Date.now()}`, amount, currency, stub: true };
  }
  const stripe = await getStripe();
  return stripe!.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    destination,
  });
}
