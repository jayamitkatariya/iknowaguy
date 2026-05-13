import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) return Response.json({ error: "Missing signature or secret" }, { status: 400 });

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const event = stripe.webhooks.constructEvent(body, sig, secret);
    const pi = event.data.object as { id: string; metadata?: Record<string, string> };

    if (event.type === "payment_intent.succeeded") {
      await getSupabaseAdmin().from("payment_transactions").update({ status: "completed" }).eq("stripe_payment_intent_id", pi.id);
    } else if (event.type === "payment_intent.payment_failed") {
      await getSupabaseAdmin().from("payment_transactions").update({ status: "failed" }).eq("stripe_payment_intent_id", pi.id);
    }

    return Response.json({ received: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
