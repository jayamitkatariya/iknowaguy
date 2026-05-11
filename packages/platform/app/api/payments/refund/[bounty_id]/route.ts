import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: { bounty_id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { reason } = await req.json();
  const { data: txn } = await getSupabaseAdmin().from("payment_transactions").select("stripe_payment_intent_id").eq("bounty_id", params.bounty_id).eq("tenant_id", auth.tenantId).single();

  if (!txn?.stripe_payment_intent_id || !process.env.STRIPE_SECRET_KEY) {
    await getSupabaseAdmin().from("bounties").update({ payment_status: "refunded", status: "cancelled" }).eq("id", params.bounty_id).eq("tenant_id", auth.tenantId);
    return Response.json({ data: { status: "refunded", stub: true } });
  }

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Refund the payment intent instead of canceling (cancel works only for uncaptured)
    await stripe.refunds.create({ payment_intent: txn.stripe_payment_intent_id, reason: "requested_by_customer" });

    await getSupabaseAdmin().from("bounties").update({ payment_status: "refunded", status: "cancelled" }).eq("id", params.bounty_id).eq("tenant_id", auth.tenantId);

    return Response.json({ data: { status: "refunded" } });
  } catch (err: any) {
    // Try canceling if refund fails (for uncaptured payments)
    try {
      const Stripe2 = await (await import("stripe")).default;
      const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY!);
      await stripe2.paymentIntents.cancel(txn.stripe_payment_intent_id);
      await getSupabaseAdmin().from("bounties").update({ payment_status: "refunded", status: "cancelled" }).eq("id", params.bounty_id).eq("tenant_id", auth.tenantId);
      return Response.json({ data: { status: "refunded" } });
    } catch (err2: any) {
      return Response.json({ error: err2.message }, { status: 500 });
    }
  }
}
