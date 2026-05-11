import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });
  return Response.json({ data: { valid: true, tenant: { id: auth.tenantId, slug: auth.tenantSlug } } });
}
