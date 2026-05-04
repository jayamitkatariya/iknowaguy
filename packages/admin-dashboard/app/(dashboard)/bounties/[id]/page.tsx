"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import EvidenceGallery from "@/components/evidence-gallery";

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    open: "badge-blue",
    assigned: "badge-amber",
    submitted: "badge-amber",
    completed: "badge-green",
    paid: "badge-green",
    disputed: "badge-red",
    cancelled: "badge-gray",
  };
  return map[status] || "badge-gray";
}

export default function BountyDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [bounty, setBounty] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"approved" | "rejected">("approved");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: b } = await supabase.from("bounties").select("*").eq("id", id).single();
      setBounty(b);

      if (b) {
        const { data: sub } = await supabase
          .from("task_submissions")
          .select("*")
          .eq("bounty_id", id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        setSubmission(sub);
      }

      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleReview() {
    setReviewing(true);
    setReviewError(null);

    const { error } = await supabase
      .from("task_submissions")
      .update({ status: reviewDecision, reviewer_notes: reviewNotes || null })
      .eq("id", submission.id);

    if (error) {
      setReviewError(error.message);
      setReviewing(false);
      return;
    }

    const newStatus = reviewDecision === "approved" ? "completed" : "open";
    const { error: bountyError } = await supabase.from("bounties").update({ status: newStatus }).eq("id", id);

    if (bountyError) {
      setReviewError(bountyError.message);
      setReviewing(false);
      return;
    }

    setBounty((prev: any) => ({ ...prev, status: newStatus }));
    setSubmission((prev: any) => ({ ...prev, status: reviewDecision, reviewer_notes: reviewNotes || null }));
    setReviewing(false);
    setToast({ type: "success", message: reviewDecision === "approved" ? "Submission approved!" : "Submission rejected." });
  }

  if (loading) {
    return (
      <div className="page-container loading-state">
        <div className="loading-state-icon">⏳</div>
        <div>Loading bounty details...</div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="page-container empty-state">
        <div className="empty-state-icon">❓</div>
        <div className="empty-state-title">Bounty not found</div>
        <div className="empty-state-sub">The bounty you are looking for does not exist.</div>
      </div>
    );
  }

  return (
    <div className="task-page">
      {/* Toast */}
      {toast && (
        <div className="toast-container" style={{ top: 80 }}>
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✓" : "⚠"}
            {toast.message}
          </div>
        </div>
      )}

      <button
        onClick={() => router.back()}
        className="task-back"
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back to Bounties
      </button>

      {/* Header */}
      <div className="task-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <h1 className="task-title">{bounty.title}</h1>
          <span className={`badge ${statusBadgeClass(bounty.status)}`}>{bounty.status}</span>
        </div>
        <div className="task-reward" style={{ fontSize: 28 }}>
          {new Intl.NumberFormat("en-US", { style: "currency", currency: bounty.currency || "USD" }).format(bounty.reward_amount || 0)}
        </div>
        <div className="task-meta">
          <span className="meta-tag">ID: {bounty.id.slice(0, 8)}</span>
          {bounty.category_id && <span className="meta-tag">{bounty.category_id}</span>}
        </div>
      </div>

      {/* Details */}
      <div className="task-body">
        <div className="task-section">
          <div className="task-label">Description</div>
          <div className="task-text">{bounty.description || "No description provided."}</div>
        </div>

        {bounty.instructions && (
          <div className="task-section">
            <div className="task-label">Instructions</div>
            <div className="task-text">{bounty.instructions}</div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 16 }}>
          {bounty.location_address && (
            <span className="meta-tag">📍 {bounty.location_address}</span>
          )}
          {bounty.deadline && (
            <span className="meta-tag">⏰ Due {new Date(bounty.deadline).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Submission */}
      {submission && (
        <div className="task-body">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="task-label" style={{ marginBottom: 0 }}>Worker Submission</div>
            <span className={`badge ${statusBadgeClass(submission.status)}`}>{submission.status}</span>
          </div>

          <div className="task-text" style={{ marginBottom: 20 }}>
            {submission.content || "No notes provided."}
          </div>

          <div className="task-label">Evidence</div>
          <EvidenceGallery mediaUrls={submission.media_urls || []} />

          {submission.reviewer_notes && (
            <div style={{ marginTop: 20, padding: 14, background: "#0d1117", borderRadius: 10, border: "1px solid #1f2937" }}>
              <div className="task-label" style={{ marginBottom: 4 }}>Reviewer Notes</div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>{submission.reviewer_notes}</div>
            </div>
          )}
        </div>
      )}

      {/* Review Controls */}
      {bounty.status === "submitted" && submission && (
        <div className="task-body">
          <div className="task-label">Review Submission</div>

          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#d1d5db" }}>
              <input
                type="radio"
                name="decision"
                value="approved"
                checked={reviewDecision === "approved"}
                onChange={() => setReviewDecision("approved")}
              />
              Approve
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#d1d5db" }}>
              <input
                type="radio"
                name="decision"
                value="rejected"
                checked={reviewDecision === "rejected"}
                onChange={() => setReviewDecision("rejected")}
              />
              Reject
            </label>
          </div>

          <textarea
            placeholder="Optional review notes..."
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            className="input"
            style={{ minHeight: 80, marginBottom: 16, resize: "vertical" }}
          />

          {reviewError && (
            <div className="toast toast-error" style={{ marginBottom: 16, position: "static", animation: "none" }}>
              ⚠ {reviewError}
            </div>
          )}

          <button
            onClick={handleReview}
            disabled={reviewing}
            className={`btn btn-block ${reviewDecision === "approved" ? "btn-success" : "btn-danger"}`}
          >
            {reviewing ? "Submitting..." : reviewDecision === "approved" ? "Approve & Complete" : "Reject & Reopen"}
          </button>
        </div>
      )}
    </div>
  );
}
