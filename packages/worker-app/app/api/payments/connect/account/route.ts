import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripeClient(key?: string): Stripe {
  return new Stripe(key || process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
    apiVersion: "2025-03-31.basil" as any,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { human_id, email } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      return NextResponse.json({
        id: `acct_stub_${Date.now()}`,
        object: "account",
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
      });
    }

    const stripe = getStripeClient(stripeKey);
    const account = await stripe.accounts.create({
      type: "express",
      country: "US",
      email: email || undefined,
      capabilities: { transfers: { requested: true } },
    });

    if (human_id) {
      await fetch(`${supabaseUrl}/rest/v1/human_profiles?id=eq.${encodeURIComponent(human_id)}`, {
        method: "PATCH",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        body: JSON.stringify({ stripe_account_id: account.id }),
      });
    }

    return NextResponse.json(account);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
