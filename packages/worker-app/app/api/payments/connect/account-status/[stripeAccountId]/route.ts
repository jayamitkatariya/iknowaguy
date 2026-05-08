import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripeClient(key?: string): Stripe {
  return new Stripe(key || process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
    apiVersion: "2025-03-31.basil" as any,
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { stripeAccountId: string } }
) {
  try {
    const stripeAccountId = params.stripeAccountId;
    const stripeKey = process.env.STRIPE_SECRET_KEY || "";

    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      return NextResponse.json({
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });
    }

    const stripe = getStripeClient(stripeKey);
    const account = await stripe.accounts.retrieve(stripeAccountId);

    return NextResponse.json({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
