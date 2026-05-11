import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyApiKey } from "@/lib/api-auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await verifyApiKey(req.headers.get("Authorization"));
  if (!auth) return Response.json({ error: "Invalid API key" }, { status: 401 });

  const { decision, notes } = await req.json();
  if (!decision || !["approved", "rejected"].includes(decision)) {
    return Response.json({ error: "decision must be approved or rejected" }, { status: 400 });
  }

  const newStatus = decision === "approved" ? "completed" : "revision_requested";
  const submissionStatus = decision === "approved" ? "approved" : "rejected";

  const updateData: Record<string, any> = { status: newStatus, updated_at: new Date().toISOString() };
  if (decision === "rejected") updateData.assigned_human_id = null;

  await getSupabaseAdmin()
    .from("task_submissions")
    .update({ status: submissionStatus, reviewer_notes: notes, updated_at: new Date().toISOString() })
    .eq("bounty_id", params.id)
    .eq("status", "submitted");

  const { data, error } = await getSupabaseAdmin()
    .from("bounties")
    .update(updateData)
    .eq("id", params.id)
    .eq("tenant_id", auth.tenantId)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
