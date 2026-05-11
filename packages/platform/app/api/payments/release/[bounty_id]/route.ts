import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: { bounty_id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { data: txn } = await getSupabaseAdmin().from("payment_transactions").select("stripe_payment_intent_id").eq("bounty_id", params.bounty_id).eq("tenant_id", auth.tenantId).single();

  if (!txn?.stripe_payment_intent_id || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ data: { status: "completed", stub: true } });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.paymentIntents.capture(txn.stripe_payment_intent_id);

    await getSupabaseAdmin().from("bounties").update({ payment_status: "completed" }).eq("id", params.bounty_id).eq("tenant_id", auth.tenantId);

    return Response.json({ data: { status: "completed" } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
