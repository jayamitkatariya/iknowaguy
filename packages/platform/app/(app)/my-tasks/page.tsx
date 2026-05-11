"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserId, apiFetch } from "@/lib/api";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchTasks = async () => {
      setLoading(true);
      const userId = getUserId();
      if (!userId) { setLoading(false); return; }
      try {
        const res = await apiFetch(`/api/bounties?assigned_human_id=${userId}&limit=100`);
        if (!cancelled) setTasks(res.data || []);
      } catch {}
      if (!cancelled) setLoading(false);
    };
    fetchTasks();
    return () => { cancelled = true; };
  }, []);

  const filtered = tasks.filter((t) => {
    if (tab === "active") return t.status === "in_progress" || t.status === "submitted" || t.status === "accepted";
    if (tab === "completed") return t.status === "completed";
    return true;
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "in_progress":
      case "accepted":
      case "submitted": return "oc-badge-amber";
      case "completed": return "oc-badge-green";
      case "revision_requested": return "oc-badge-red";
      default: return "oc-badge-gray";
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="oc-page-title">My Tasks</h1>
        <p className="oc-page-subtitle">Track your active and completed bounties</p>
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", padding: "4px", background: "var(--oc-bg-tertiary)", borderRadius: "var(--oc-radius)", border: "1px solid var(--oc-border)", width: "fit-content" }}>
        {(["active", "completed", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              border: "none",
              fontFamily: "var(--oc-font)",
              background: tab === t ? "var(--oc-bg-secondary)" : "transparent",
              color: tab === t ? "var(--oc-text)" : "var(--oc-text-muted)",
              boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
              transition: "all 150ms ease",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1,2].map((i) => (
            <div key={i} className="oc-card" style={{ height: "80px", padding: "20px" }}>
              <div className="skeleton skeleton-title" style={{ width: "40%", marginBottom: "8px" }} />
              <div className="skeleton skeleton-text" style={{ width: "25%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="oc-empty-state">
          <div className="oc-empty-icon"></div>
          <h3 className="oc-empty-title">No tasks yet</h3>
          <p className="oc-empty-sub" style={{ marginBottom: "20px" }}>Browse available bounties to get started</p>
          <Link href="/browse" className="oc-btn oc-btn-primary">
            Browse Tasks
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((t) => {
            const badgeClass = getStatusBadge(t.status);
            return (
              <div key={t.id} className="oc-card" style={{
                padding: "20px 24px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Link href={`/my-tasks/${t.id}`} style={{ fontSize: "15px", fontWeight: 600, color: "var(--oc-text-strong)", fontFamily: "var(--oc-font)", textDecoration: "none", transition: "color 150ms" }}
                      onMouseEnter={(e) => e.currentTarget.style.color = "var(--oc-accent)"}
                      onMouseLeave={(e) => e.currentTarget.style.color = "var(--oc-text-strong)"}
                    >
                      {t.title || "Untitled Task"}
                    </Link>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
                    Assigned {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>
                    ${t.reward_amount || "—"}
                  </span>
                  <span className={`oc-badge ${badgeClass}`}>
                    {t.status?.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
