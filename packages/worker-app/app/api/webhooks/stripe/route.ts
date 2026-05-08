import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

function getStripeClient(key?: string): Stripe {
  return new Stripe(key || process.env.STRIPE_SECRET_KEY || "sk_test_stub", {
    apiVersion: "2025-03-31.basil" as any,
  });
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
    }

    const body = await req.text();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const bountyId = paymentIntent.metadata?.bounty_id;

        if (bountyId) {
          await fetch(`${supabaseUrl}/rest/v1/payment_transactions?id=eq.${encodeURIComponent(paymentIntent.id)}`, {
            method: "PATCH",
            headers: {
              "apikey": serviceKey,
              "Authorization": `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ status: "completed" }),
          });

          await fetch(`${supabaseUrl}/rest/v1/bounties?id=eq.${encodeURIComponent(bountyId)}`, {
            method: "PATCH",
            headers: {
              "apikey": serviceKey,
              "Authorization": `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
              "Prefer": "return=minimal",
            },
            body: JSON.stringify({ payment_status: "released" }),
          });
        }
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await fetch(`${supabaseUrl}/rest/v1/payment_transactions?id=eq.${encodeURIComponent(paymentIntent.id)}`, {
          method: "PATCH",
          headers: {
            "apikey": serviceKey,
            "Authorization": `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
          },
          body: JSON.stringify({ status: "failed" }),
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
