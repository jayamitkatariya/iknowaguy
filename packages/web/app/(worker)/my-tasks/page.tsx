"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState<"active" | "completed" | "all">("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await supabase.from("bounty_assignments").select("*, bounties(*)").order("created_at", { ascending: false });
    setTasks(data || []);
    setLoading(false);
  };

  const filtered = tasks.filter((t) => {
    if (tab === "active") return t.status === "in_progress" || t.status === "submitted";
    if (tab === "completed") return t.status === "completed" || t.status === "approved";
    return true;
  });

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      in_progress: "badge-warning", submitted: "badge-warning",
      completed: "badge-success", approved: "badge-success",
      rejected: "badge-error",
    };
    return map[s] || "badge-neutral";
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Tasks</h1>
        <p>Track your active and completed bounties</p>
      </div>

      <div className="tab-list" style={{ marginBottom: "24px" }}>
        {(["active", "completed", "all"] as const).map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[1,2].map((i) => <div key={i} className="card" style={{ height: "100px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📋</div>
          <h3>No tasks yet</h3>
          <p>Browse available bounties to get started</p>
          <Link href="/browse" className="btn btn-primary" style={{ marginTop: "16px" }}>Browse Tasks</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((t) => (
            <div key={t.id} className="card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>{t.bounties?.title || "Untitled Task"}</h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Assigned {new Date(t.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="badge badge-success" style={{ fontSize: "15px", fontWeight: 700 }}>${t.bounties?.reward || "—"}</span>
                <span className={`badge ${statusBadge(t.status)}`}>{t.status?.replace("_", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
