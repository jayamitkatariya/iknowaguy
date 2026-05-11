import { verifyApiKey } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: Request, { params }: { params: { human_id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ data: { charges_enabled: true, payouts_enabled: true, details_submitted: true, stub: true } });
  }

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { data: human } = await getSupabaseAdmin().from("human_profiles").select("stripe_account_id").eq("id", params.human_id).single();
    if (!human?.stripe_account_id) return Response.json({ data: { charges_enabled: false, payouts_enabled: false, details_submitted: false } });

    const account = await stripe.accounts.retrieve(human.stripe_account_id);
    return Response.json({ data: { charges_enabled: account.charges_enabled, payouts_enabled: account.payouts_enabled, details_submitted: account.details_submitted } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
