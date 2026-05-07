"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BountyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchBounty(); }, [id]);

  const fetchBounty = async () => {
    setLoading(true);
    const { data } = await supabase.from("bounties").select("*, categories(name)").eq("id", id).single();
    setBounty(data);
    setLoading(false);
  };

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in to accept a task."); setAccepting(false); return; }
    const { error: updateError } = await supabase.from("bounties").update({
      assigned_human_id: user.id,
      status: "in_progress",
    }).eq("id", id);
    if (updateError) {
      setError(updateError.message);
      setAccepting(false);
    } else {
      router.push("/my-tasks");
    }
  };

  const getDeadline = (d: string | null) => {
    if (!d) return "No deadline";
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    return `${days}d left`;
  };

  if (loading) return (
    <div style={{ padding: "40px 0" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  );

  if (!bounty) return (
    <div className="oc-empty-state">
      <div className="oc-empty-icon"></div>
      <div className="oc-empty-title">Bounty not found</div>
    </div>
  );

  return (
    <div>
      <Link href="/browse" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24, fontSize: 12, color: "var(--oc-text-muted)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>
        ← Back to Browse
      </Link>

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em", marginBottom: 8 }}>{bounty.title}</h1>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {bounty.categories?.name && <span className="oc-badge oc-badge-gray">{bounty.categories.name}</span>}
              <span className={`oc-badge ${bounty.status === "open" ? "oc-badge-green" : "oc-badge-amber"}`}>{bounty.status?.replace("_", " ")}</span>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${bounty.reward_amount || 0}</div>
        </div>
      </div>

      <div className="oc-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--oc-font)" }}>Description</h3>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{bounty.description}</p>
        {bounty.instructions && (
          <>
            <div style={{ height: 1, background: "var(--oc-border)", margin: "24px 0" }} />
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--oc-font)" }}>Requirements</h3>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{bounty.instructions}</p>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
        <div className="oc-stat-card">
          <div className="oc-stat-label">Reward</div>
          <div className="oc-stat-value" style={{ color: "var(--oc-accent)" }}>${bounty.reward_amount || 0}</div>
        </div>
        <div className="oc-stat-card">
          <div className="oc-stat-label">Category</div>
          <div className="oc-stat-value" style={{ fontSize: 14 }}>{bounty.categories?.name || "—"}</div>
        </div>
        <div className="oc-stat-card">
          <div className="oc-stat-label">Deadline</div>
          <div className="oc-stat-value" style={{ fontSize: 14 }}>{getDeadline(bounty.deadline)}</div>
        </div>
        <div className="oc-stat-card">
          <div className="oc-stat-label">Created</div>
          <div className="oc-stat-value" style={{ fontSize: 14 }}>{new Date(bounty.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      {error && <p style={{ color: "var(--oc-red)", fontSize: 13, marginBottom: 16, fontFamily: "var(--oc-font)" }}>{error}</p>}

      {bounty.status === "open" && (
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="oc-btn oc-btn-primary"
          style={{ fontSize: 14, padding: "12px 32px" }}
        >
          {accepting ? "Accepting..." : "Accept Task"}
        </button>
      )}
    </div>
  );
}