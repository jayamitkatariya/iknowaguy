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
    const { human_id, refresh_url, return_url } = body;

    const stripeKey = process.env.STRIPE_SECRET_KEY || "";
    if (!stripeKey || !stripeKey.startsWith("sk_")) {
      return NextResponse.json({ url: return_url || "https://iknowaguy.vercel.app/earnings?connected=stub" });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    let accountId = "";
    if (human_id && supabaseUrl && serviceKey) {
      const res = await fetch(`${supabaseUrl}/rest/v1/human_profiles?id=eq.${encodeURIComponent(human_id)}&select=stripe_account_id&limit=1`, {
        headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}` },
      });
      const data = await res.json();
      accountId = data?.[0]?.stripe_account_id || "";
    }

    if (!accountId) {
      return NextResponse.json({ error: "No Stripe account found" }, { status: 404 });
    }

    const stripe = getStripeClient(stripeKey);
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refresh_url || "https://iknowaguy.vercel.app/earnings",
      return_url: return_url || "https://iknowaguy.vercel.app/earnings?connected=true",
      type: "account_onboarding",
    });

    return NextResponse.json(link);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
