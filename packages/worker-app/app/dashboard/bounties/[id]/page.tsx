"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BountyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const fetchBounty = async () => {
    try {
      const { data: b, error: bErr } = await supabase
        .from("bounties")
        .select("*, categories(name)")
        .eq("id", id)
        .single();

      if (bErr) throw new Error(bErr.message);
      setBounty(b);

      const { data: subs } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("bounty_id", id)
        .order("created_at", { ascending: false });

      setSubmissions(subs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleReview = async (decision: "approved" | "rejected") => {
    try {
      if (submissions.length === 0) return;

      const sub = submissions[0];
      await supabase
        .from("task_submissions")
        .update({ status: decision, reviewer_notes: reviewNotes })
        .eq("id", sub.id);

      const newStatus = decision === "approved" ? "completed" : "in_progress";
      await supabase
        .from("bounties")
        .update({ status: newStatus })
        .eq("id", id);

      router.refresh();
      fetchBounty();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const statusColors: Record<string, string> = {
    open: "oc-badge-green",
    in_progress: "oc-badge-amber",
    accepted: "oc-badge-amber",
    submitted: "oc-badge-cyan",
    reviewing: "oc-badge-cyan",
    completed: "oc-badge-green",
    approved: "oc-badge-green",
    rejected: "oc-badge-red",
    cancelled: "oc-badge-gray",
    disputed: "oc-badge-red",
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
        <div className="skeleton skeleton-title" style={{ height: "32px", width: "60%", marginBottom: "1rem" }} />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    );
  }

  if (error || !bounty) {
    return (
      <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
        <p style={{ color: "var(--oc-red)" }}>{error || "Bounty not found"}</p>
        <Link href="/dashboard/bounties" style={{ color: "var(--oc-accent)", marginTop: "1rem", display: "inline-block" }}>← Back to Bounties</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <Link href="/dashboard/bounties" style={{ color: "var(--oc-text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "1.5rem", textDecoration: "none" }}>
        ← Back to Bounties
      </Link>

      <header style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "bold" }}>{bounty.title}</h1>
          <span className={`oc-badge ${statusColors[bounty.status] || "oc-badge-gray"}`} style={{ textTransform: "capitalize" }}>
            {bounty.status?.replace(/_/g, " ")}
          </span>
        </div>
        <p style={{ color: "var(--oc-text-muted)" }}>{bounty.categories?.name && `Category: ${bounty.categories.name}`}</p>
      </header>

      <div className="oc-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.75rem" }}>Description</h2>
        <p style={{ color: "var(--oc-text-muted)", lineHeight: 1.7 }}>{bounty.description}</p>
        {bounty.instructions && (
          <>
            <h2 style={{ fontSize: "1rem", fontWeight: "600", marginTop: "1.5rem", marginBottom: "0.75rem" }}>Instructions</h2>
            <p style={{ color: "var(--oc-text-muted)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{bounty.instructions}</p>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="oc-card">
          <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Reward</p>
          <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>${bounty.reward_amount || 0}</p>
        </div>
        <div className="oc-card">
          <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Worker</p>
          <p style={{ fontSize: "1rem", fontWeight: 500 }}>{bounty.assigned_human_id ? "Assigned" : "Open"}</p>
        </div>
        <div className="oc-card">
          <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase", marginBottom: "0.25rem" }}>Payment</p>
          <p style={{ fontSize: "1rem", fontWeight: 500 }}>{bounty.payment_status || "pending"}</p>
        </div>
      </div>

      {submissions.length > 0 && (
        <div className="oc-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Submissions</h2>
          {submissions.map((sub) => (
            <div key={sub.id} style={{ padding: "1rem", background: "var(--oc-bg-tertiary)", borderRadius: "8px", marginBottom: "0.75rem" }}>
              <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>
                Submitted: {new Date(sub.created_at).toLocaleString()}
              </p>
              <p style={{ marginBottom: "0.5rem", whiteSpace: "pre-wrap" }}>{sub.content || "No content"}</p>
              {sub.media_urls?.length > 0 && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                  {sub.media_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--oc-accent)", fontSize: "0.8rem" }}>
                      Evidence {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <span className={`oc-badge ${sub.status === "approved" ? "oc-badge-green" : sub.status === "rejected" ? "oc-badge-red" : "oc-badge-amber"}`}>
                {sub.status}
              </span>
            </div>
          ))}

          {bounty.status === "submitted" || bounty.status === "reviewing" ? (
            <div style={{ marginTop: "1rem" }}>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="oc-input"
                placeholder="Review notes (optional)..."
                rows={2}
                style={{ marginBottom: "0.75rem", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button onClick={() => handleReview("approved")} className="oc-btn oc-btn-success">
                  Approve
                </button>
                <button onClick={() => handleReview("rejected")} className="oc-btn oc-btn-danger">
                  Reject
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
