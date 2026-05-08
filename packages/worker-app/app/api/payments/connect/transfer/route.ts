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
    const { bounty_id, amount, currency } = body;

    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      return NextResponse.json({
        id: `tr_stub_${Date.now()}`,
        object: "transfer",
        amount: Math.round((amount || 0) * 100),
        currency: currency || "usd",
        status: "succeeded",
      });
    }

    const stripe = getStripeClient(stripeKey);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    let destination = "";
    if (bounty_id && supabaseUrl && serviceKey) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/bounties?id=eq.${encodeURIComponent(bounty_id)}&select=assigned_human_id&limit=1`,
        { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
      );
      const data = await res.json();
      const humanId = data?.[0]?.assigned_human_id;

      if (humanId) {
        const profRes = await fetch(
          `${supabaseUrl}/rest/v1/human_profiles?id=eq.${encodeURIComponent(humanId)}&select=stripe_account_id&limit=1`,
          { headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` } }
        );
        const profData = await profRes.json();
        destination = profData?.[0]?.stripe_account_id || "";
      }
    }

    if (!destination) {
      return NextResponse.json({ error: "No destination Stripe account" }, { status: 400 });
    }

    const transfer = await stripe.transfers.create({
      amount: Math.round((amount || 0) * 100),
      currency: currency || "usd",
      destination,
    });

    return NextResponse.json(transfer);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
