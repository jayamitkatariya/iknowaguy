"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function MyTaskDetailPage() {
  const params = useParams();
  const bountyId = params.id as string;

  const [bounty, setBounty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchTask = async () => {
      try {
        const res = await apiFetch(`/api/bounties/${bountyId}`);
        if (!cancelled) { setBounty(res.data); setLoading(false); }
      } catch {
        if (!cancelled) { setError("Task not found or you don't have access to it."); setLoading(false); }
      }
    };
    if (bountyId) fetchTask();
    return () => { cancelled = true; };
  }, [bountyId]);

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "in_progress":
      case "accepted": return "oc-badge-amber";
      case "submitted": return "oc-badge-blue";
      case "completed": return "oc-badge-green";
      case "revision_requested": return "oc-badge-red";
      default: return "oc-badge-gray";
    }
  };

  const formatReward = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "usd" }).format(amount);
  };

  if (loading) return (
    <div style={{ padding: "2rem" }}>
      <div className="skeleton skeleton-title" style={{ marginBottom: "1rem" }} />
      <div className="skeleton skeleton-text" />
      <div className="skeleton skeleton-text" />
    </div>
  );

  if (error) return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <div className="oc-card" style={{ textAlign: "center", padding: "3rem" }}>
        <p style={{ color: "var(--oc-red)", marginBottom: "1rem" }}>{error}</p>
        <Link href="/my-tasks" className="oc-btn oc-btn-ghost">← Back to My Tasks</Link>
      </div>
    </div>
  );

  if (!bounty) return null;

  return (
    <div style={{ padding: "2rem", maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <Link
          href="/my-tasks"
          style={{
            color: "var(--oc-text-muted)",
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          ← Back to My Tasks
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
              {bounty.title}
            </h1>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className={`oc-badge ${getStatusBadge(bounty.status)}`}>
                {bounty.status?.replace("_", " ")}
              </span>
              {bounty.category?.name && (
                <span className="oc-badge oc-badge-gray">{bounty.category.name}</span>
              )}
              <span style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)" }}>
                {bounty.reward_amount ? formatReward(bounty.reward_amount, bounty.currency || "usd") : "—"}
              </span>
            </div>
          </div>
          {bounty.status === "in_progress" || bounty.status === "accepted" && (
            <Link href={`/my-tasks/${bountyId}/submit`} className="oc-btn oc-btn-primary">
              Submit Work
            </Link>
          )}
          {bounty.status === "submitted" && (
            <span style={{ color: "var(--oc-accent)", fontWeight: 600, fontSize: "0.875rem" }}>
              Awaiting review...
            </span>
          )}
        </div>
      </div>

      <div className="oc-card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--oc-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Task Description
        </h2>
        <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--oc-text)" }}>
          {bounty.description}
        </p>
      </div>

      {bounty.instructions && (
        <div className="oc-card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--oc-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Instructions
          </h2>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--oc-text)" }}>
            {bounty.instructions}
          </p>
        </div>
      )}

      <div className="oc-card">
        <h2 style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--oc-text-muted)", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Task Details
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", marginBottom: "0.25rem" }}>Reward</p>
            <p style={{ fontWeight: 600 }}>
              {bounty.reward_amount ? formatReward(bounty.reward_amount, bounty.currency || "usd") : "—"}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", marginBottom: "0.25rem" }}>Status</p>
            <p style={{ fontWeight: 600, textTransform: "capitalize" }}>
              {bounty.status?.replace("_", " ")}
            </p>
          </div>
          <div>
            <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", marginBottom: "0.25rem" }}>Category</p>
            <p style={{ fontWeight: 600 }}>{bounty.category?.name || "—"}</p>
          </div>
          {bounty.deadline && (
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)", marginBottom: "0.25rem" }}>Deadline</p>
              <p style={{ fontWeight: 600 }}>
                {new Date(bounty.deadline).toLocaleDateString("en-US", {
                  month: "short", day: "numeric", year: "numeric"
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
