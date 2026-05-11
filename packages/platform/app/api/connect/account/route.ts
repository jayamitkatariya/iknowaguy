import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { email, human_id, country = "US" } = await req.json();
  if (!email) return Response.json({ error: "email is required" }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    const stubId = `acct_stub_${Date.now()}`;
    if (human_id) {
      await getSupabaseAdmin().from("human_profiles").update({ stripe_account_id: stubId }).eq("id", human_id);
    }
    return Response.json({ data: { id: stubId, stripe_account_id: stubId, stub: true } });
  }

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const account = await stripe.accounts.create({
      type: "express",
      country,
      email,
      capabilities: { transfers: { requested: true } },
    });

    if (human_id) {
      await getSupabaseAdmin().from("human_profiles").update({ stripe_account_id: account.id }).eq("id", human_id);
    }

    return Response.json({ data: { id: account.id, stripe_account_id: account.id, country: account.country } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
