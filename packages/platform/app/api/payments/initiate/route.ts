import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { bounty_id, amount, currency = "USD" } = await req.json();
  if (!bounty_id || !amount) return Response.json({ error: "bounty_id and amount are required" }, { status: 400 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ data: { id: `pi_stub_${Date.now()}`, status: "requires_capture", stub: true } });
  }

  try {
    const Stripe = await (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      capture_method: "manual",
      metadata: { bounty_id, tenant_id: auth.tenantId },
    });

    return Response.json({ data: { id: paymentIntent.id, client_secret: paymentIntent.client_secret, status: paymentIntent.status } });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
