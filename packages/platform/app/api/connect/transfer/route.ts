import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { amount, human_id, currency = "usd" } = await req.json();
  if (!amount || !human_id) return Response.json({ error: "amount and human_id are required" }, { status: 400 });

  const { data: human } = await getSupabaseAdmin().from("human_profiles").select("stripe_account_id").eq("id", human_id).single();

  if (!human?.stripe_account_id || !process.env.STRIPE_SECRET_KEY) {
    return Response.json({ data: { id: `tr_stub_${Date.now()}`, stub: true } });
  }

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency,
      destination: human.stripe_account_id,
    });

    return Response.json({ data: { id: transfer.id, amount: transfer.amount / 100, currency: transfer.currency } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
