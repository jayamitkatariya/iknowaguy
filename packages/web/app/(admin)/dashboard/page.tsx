"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0, paid: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [bounties, payments] = await Promise.all([
      supabase.from("bounties").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*"),
    ]);
    const all = bounties.data || [];
    setStats({
      total: all.length,
      active: all.filter((b) => b.status === "open" || b.status === "in_progress").length,
      completed: all.filter((b) => b.status === "completed").length,
      paid: (payments.data || []).reduce((sum, p) => sum + (p.amount || 0), 0),
    });
    setRecent(all.slice(0, 5));
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Dashboard</h1>
          <p>Overview of your bounties and payments</p>
        </div>
        <Link href="/bounties/new" className="btn btn-primary">+ Create Bounty</Link>
      </div>

      <div className="grid-4" style={{ marginBottom: "40px" }}>
        {[
          { label: "Total Bounties", value: stats.total, icon: "🎯" },
          { label: "Active", value: stats.active, icon: "⚡" },
          { label: "Completed", value: stats.completed, icon: "✅" },
          { label: "Total Paid", value: `$${stats.paid.toLocaleString()}`, icon: "💰" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <p className="label">{s.label}</p>
              <span style={{ fontSize: "24px" }}>{s.icon}</span>
            </div>
            <p className="value">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>Recent Bounties</h2>
      {loading ? (
        <div className="card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : recent.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No bounties yet</h3>
          <p>Create your first bounty to get started</p>
          <Link href="/bounties/new" className="btn btn-primary" style={{ marginTop: "16px" }}>Create Bounty</Link>
        </div>
      ) : (
        <div className="card-flat" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Status</th><th>Reward</th><th>Created</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/bounties/${b.id}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</Link></td>
                  <td><span className={`badge ${b.status === "open" ? "badge-success" : b.status === "completed" ? "badge-neutral" : "badge-warning"}`}>{b.status}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>${b.reward || 0}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
