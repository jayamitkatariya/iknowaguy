"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import EvidenceUpload from "@/components/evidence-upload";

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  assigned: { bg: "#dbeafe", text: "#1e40af", dot: "#3b82f6" },
  submitted: { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b" },
  completed: { bg: "#e0e7ff", text: "#3730a3", dot: "#6366f1" },
  paid: { bg: "#d1fae5", text: "#065f46", dot: "#10b981" },
  cancelled: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444" },
};

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.open;
  return (
    <span style={{ background: c.bg, color: c.text, padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

export default function TaskDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [bounty, setBounty] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [completionCode, setCompletionCode] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function load() {
      const { data: b } = await supabase.from("bounties").select("*").eq("id", id).single();
      setBounty(b);
      if (b?.category_id) {
        const { data: cat } = await supabase.from("categories").select("name").eq("id", b.category_id).single();
        setCategory(cat);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleAccept() {
    setAccepting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    await supabase.from("bounties").update({ status: "assigned", assigned_human_id: user.id }).eq("id", id);
    setBounty((b: any) => ({ ...b, status: "assigned", assigned_human_id: user.id }));
    setAccepting(false);
  }

  async function handleSubmitEvidence() {
    if (!notes.trim()) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    await supabase.from("task_submissions").insert({
      bounty_id: id,
      human_id: user.id,
      content: notes,
      media_urls: photos.length > 0 ? photos : null,
    });
    await supabase.from("bounties").update({ status: "submitted" }).eq("id", id);
    setBounty((b: any) => ({ ...b, status: "submitted" }));
    setSuccess("✅ Evidence submitted! Your work is under review.");
    setSubmitting(false);
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontFamily: "system-ui" }}>
      Loading task details...
    </div>
  );

  if (!bounty) return (
    <div style={{ padding: 40, textAlign: "center", color: "#6b7280", fontFamily: "system-ui" }}>
      Task not found.
    </div>
  );

  const isOpen = bounty.status === "open";
  const isAssigned = bounty.status === "assigned";
  const isSubmitted = bounty.status === "submitted";

  return (
    <div style={{ padding: "24px 32px", maxWidth: 720, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .detail-page { color: #f9fafb }
        .back-btn { background: none, border: none, color: #9ca3af, cursor: pointer, fontSize: 14px, padding: 0, marginBottom: 16px, display: "flex", alignItems: center, gap: 4 }
        .back-btn:hover { color: #f9fafb }
        .detail-card { background: #1f2937, border: 1px solid #374151, borderRadius: 16px, padding: 28px, marginBottom: 20px }
        .section-title { fontSize: 12px, fontWeight: 700, color: #6b7280, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8px }
        .section-text { fontSize: 14px, color: #d1d5db, lineHeight: 1.6, margin: 0 }
        .reward-box { background: #1f2937, border: 1px solid #374151, borderRadius: 16px, padding: 20px, textAlign: "center", marginBottom: 20px }
        .reward-amount { fontSize: 36px, fontWeight: 800, color: #818cf8 }
        .reward-label { fontSize: 12px, color: #6b7280, marginTop: 2 }
        .action-btn { width: 100%, padding: 14px, borderRadius: 10px, border: none, fontSize: 15px, fontWeight: 700, cursor: pointer, transition: background 0.15s }
        .submit-btn { background: #6366f1, color: white, marginTop: 12px }
        .submit-btn:hover { background: #4f46e5 }
        .submit-btn:disabled { background: #374151, color: #6b7280, cursor: not-allowed }
        .success-msg { background: #022c22, border: 1px solid #065f46, color: #6ee7b7, padding: 14px, borderRadius: 10px, fontSize: 14px, marginTop: 12px }
        textarea { width: 100%, background: #111827, border: "1px solid #374151", borderRadius: 8px, color: #f9fafb, padding: 10px 12px, fontSize: 14px, fontFamily: inherit, resize: "vertical", minHeight: 100, boxSizing: "border-box" }
        textarea:focus { outline: none, border-color: #6366f1 }
        input[type="text"] { width: 100%, background: #111827, border: "1px solid #374151", borderRadius: 8px, color: #f9fafb, padding: 8px 12px, fontSize: 14px, boxSizing: "border-box" }
        input[type="text"]:focus { outline: none, border-color: #6366f1 }
        .meta-row { display: flex, flexWrap: "wrap", gap: 8px, marginTop: 16px }
        .meta-tag { fontSize: 12px, padding: "3px 10px", borderRadius: 6px, background: "#374151", color: "#d1d5db" }
      `}</style>

      <div className="detail-page">
        <button className="back-btn" onClick={() => router.back()}>
          ← Back
        </button>

        {success && <div className="success-msg">{success}</div>}

        {/* Reward Banner */}
        <div className="reward-box">
          <div className="reward-amount">${bounty.reward_amount}</div>
          <div className="reward-label">{bounty.currency || "USD"} · {bounty.status}</div>
        </div>

        {/* Main Card */}
        <div className="detail-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px", color: "#f9fafb", letterSpacing: "-0.01em" }}>{bounty.title}</h1>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <StatusBadge status={bounty.status} />
                {category?.name && <span className="meta-tag">{category.name}</span>}
              </div>
            </div>
          </div>

          <div className="meta-row">
            {bounty.location_address && <span className="meta-tag">📍 {bounty.location_address}</span>}
            {bounty.deadline && <span className="meta-tag">⏰ Due {new Date(bounty.deadline).toLocaleDateString()}</span>}
          </div>
        </div>

        {/* Description */}
        <div className="detail-card">
          <p className="section-title">Description</p>
          <p className="section-text" style={{ whiteSpace: "pre-wrap" }}>{bounty.description}</p>
        </div>

        {/* Instructions */}
        {bounty.instructions && (
          <div className="detail-card">
            <p className="section-title">Instructions</p>
            <p className="section-text" style={{ whiteSpace: "pre-wrap" }}>{bounty.instructions}</p>
          </div>
        )}

        {/* Accept Button */}
        {isOpen && (
          <button
            className="action-btn"
            style={{ background: "#10b981", color: "white" }}
            onClick={handleAccept}
            disabled={accepting}
            onMouseOver={(e) => (e.currentTarget.style.background = "#059669")}
            onMouseOut={(e) => (e.currentTarget.style.background = "#10b981")}
          >
            {accepting ? "Accepting..." : "Accept This Task"}
          </button>
        )}

        {/* Submit Evidence */}
        {isAssigned && (
          <div className="detail-card">
            <p className="section-title">Submit Your Work</p>
            <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>Describe what you did and attach photos as evidence.</p>

            <textarea
              placeholder="Describe what you did to complete this task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginBottom: 12 }}
            />

            <EvidenceUpload bountyId={id} onPhotosChange={setPhotos} photos={photos} />

            <button
              className="action-btn submit-btn"
              onClick={handleSubmitEvidence}
              disabled={submitting || !notes.trim()}
              style={{ marginTop: 16 }}
            >
              {submitting ? "Submitting..." : "Submit Evidence"}
            </button>
          </div>
        )}

        {isSubmitted && (
          <div className="detail-card" style={{ textAlign: "center", padding: "32px 28px" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: "#d1d5db", margin: "0 0 4px" }}>Submitted — Under Review</p>
            <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>An admin is reviewing your work. You'll be notified once it's approved.</p>
          </div>
        )}
      </div>
    </div>
  );
}
