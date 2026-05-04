"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
      supabase.from("bounties").select("*").eq("id", id).single(),
      supabase.from("bounty_assignments").select("*").eq("bounty_id", id),
    ]);
    setBounty(b.data);
    setSubmissions(s.data || []);
    setLoading(false);
  };

  const approveSubmission = async (subId: string) => {
    await supabase.from("bounty_assignments").update({ status: "approved" }).eq("id", subId);
    await supabase.from("bounties").update({ status: "completed" }).eq("id", id);
    fetchData();
  };

  const rejectSubmission = async (subId: string) => {
    await supabase.from("bounty_assignments").update({ status: "rejected" }).eq("id", subId);
    fetchData();
  };

  if (loading) return <div className="card" style={{ height: "300px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>;
  if (!bounty) return <div className="empty-state"><div className="icon">🔍</div><h3>Bounty not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{bounty.title}</h1>
        <p>Created {new Date(bounty.created_at).toLocaleDateString()}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: "32px", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px" }}>Description</h3>
            <p style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--text-primary)" }}>{bounty.description}</p>
            {bounty.requirements && (
              <>
                <div className="divider" />
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Requirements</h3>
                <p style={{ fontSize: "14px", lineHeight: 1.7, color: "var(--text-secondary)" }}>{bounty.requirements}</p>
              </>
            )}
          </div>

          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Submissions ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="empty-state"><p style={{ color: "var(--text-secondary)" }}>No submissions yet</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {submissions.map((s) => (
                <div key={s.id} className="card" style={{ padding: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <span className={`badge ${s.status === "approved" ? "badge-success" : s.status === "rejected" ? "badge-error" : "badge-warning"}`}>{s.status}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{new Date(s.created_at).toLocaleDateString()}</span>
                  </div>
                  {s.submission_text && <p style={{ fontSize: "14px", lineHeight: 1.7, marginBottom: "16px" }}>{s.submission_text}</p>}
                  {s.status === "submitted" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button className="btn btn-primary btn-sm" onClick={() => approveSubmission(s.id)}>✓ Approve</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => rejectSubmission(s.id)} style={{ color: "var(--error)" }}>✗ Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="card" style={{ padding: "28px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Reward</p>
            <p style={{ fontSize: "36px", fontWeight: 700, color: "var(--accent)" }}>${bounty.reward || 0}</p>
          </div>
          <div className="card" style={{ padding: "28px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Status</p>
            <span className={`badge ${bounty.status === "open" ? "badge-success" : bounty.status === "completed" ? "badge-neutral" : "badge-warning"}`} style={{ fontSize: "14px" }}>{bounty.status}</span>
          </div>
          <div className="card" style={{ padding: "28px", marginBottom: "16px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Category</p>
            <span className="badge badge-neutral">{bounty.category || "Uncategorized"}</span>
          </div>
          {bounty.deadline && (
            <div className="card" style={{ padding: "28px" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "8px" }}>Deadline</p>
              <p style={{ fontSize: "15px", fontWeight: 600 }}>{new Date(bounty.deadline).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
