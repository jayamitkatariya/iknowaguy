"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BountyDetailPage() {
  const { id } = useParams();
  const [bounty, setBounty] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const [b, s] = await Promise.all([
      supabase.from("bounties").select("*, categories(name)").eq("id", id).single(),
      supabase.from("task_submissions").select("*").eq("bounty_id", id),
    ]);
    setBounty(b.data);
    setSubmissions(s.data || []);
    setLoading(false);
  };

  const approveSubmission = async (subId: string) => {
    await supabase.from("task_submissions").update({ status: "approved" }).eq("id", subId);
    await supabase.from("bounties").update({ status: "completed" }).eq("id", id);
    fetchData();
  };

  const rejectSubmission = async (subId: string) => {
    await supabase.from("task_submissions").update({ status: "rejected" }).eq("id", subId);
    fetchData();
  };

  if (loading) return <div className="oc-card" style={{ height: "300px", background: 'var(--oc-bg-secondary)', border: '1px solid var(--oc-border)' }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>;
  if (!bounty) return (
    <div className="oc-card">
      <div className="oc-empty-state">
        <div className="oc-empty-icon"></div>
        <div className="oc-empty-title">Bounty not found</div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--oc-bg)', padding: '32px' }} className="page-wrapper">
      <Link href="/bounties" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24, fontSize: 12, color: "var(--oc-text-muted)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>
        ← Back to Bounties
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", marginBottom: 4 }}>{bounty.title}</h1>
        <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Created {new Date(bounty.created_at).toLocaleDateString()}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", alignItems: "start" }}>
        <div>
          <div className="oc-card" style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--oc-font)" }}>Description</h3>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{bounty.description}</p>
            {bounty.instructions && (
              <>
                <div style={{ height: 1, background: "var(--oc-border)", margin: "24px 0" }} />
                <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, fontFamily: "var(--oc-font)" }}>Requirements</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{bounty.instructions}</p>
              </>
            )}
          </div>

          <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16, fontFamily: "var(--oc-font)" }}>Submissions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="oc-card"><div className="oc-empty-state"><div className="oc-empty-icon"></div><div className="oc-empty-title">No submissions yet</div></div></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {submissions.map((s) => (
                <div key={s.id} className="oc-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span className={`oc-badge ${s.status === "approved" ? "oc-badge-green" : s.status === "rejected" ? "oc-badge-red" : "oc-badge-amber"}`}>{s.status}</span>
                    <span style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  {s.content && <p style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 16, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{s.content}</p>}
                  {s.status === "submitted" && (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="oc-btn oc-btn-success" onClick={() => approveSubmission(s.id)}>✓ Approve</button>
                      <button className="oc-btn oc-btn-danger" onClick={() => rejectSubmission(s.id)}>✗ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="oc-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 8, fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reward</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${bounty.reward_amount || 0}</p>
          </div>
          <div className="oc-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 8, fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Status</p>
            <span className={`oc-badge ${bounty.status === "open" ? "oc-badge-green" : bounty.status === "completed" ? "oc-badge-gray" : "oc-badge-amber"}`} style={{ fontSize: 12 }}>{bounty.status}</span>
          </div>
          <div className="oc-card" style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 8, fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</p>
            <span className="oc-badge oc-badge-gray">{bounty.categories?.name || "Uncategorized"}</span>
          </div>
          {bounty.deadline && (
            <div className="oc-card">
              <p style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 8, fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Deadline</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{new Date(bounty.deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
