import { verifyApiKey } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { human_id, account_id, refresh_url, return_url } = await req.json();

  let resolvedAccountId = account_id;

  if (!resolvedAccountId && human_id) {
    const { data: human } = await getSupabaseAdmin().from("human_profiles").select("stripe_account_id").eq("id", human_id).single();
    resolvedAccountId = human?.stripe_account_id;
  }

  if (!resolvedAccountId) {
    return Response.json({ error: "account_id or valid human_id is required" }, { status: 400 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ data: { url: `https://connect.stripe.com/setup/e/${resolvedAccountId}`, stub: true } });
  }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const link = await stripe.accountLinks.create({
      account: resolvedAccountId,
      refresh_url: refresh_url || `${new URL(req.url).origin}/earnings`,
      return_url: return_url || `${new URL(req.url).origin}/earnings`,
      type: "account_onboarding",
    });
    return Response.json({ data: { url: link.url } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
