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
      supabase.from("bounties").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("payment_transactions").select("*"),
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div className="oc-page-header" style={{ marginBottom: 0 }}>
          <h1 className="oc-page-title">Dashboard</h1>
          <p className="oc-page-subtitle">Overview of your bounties and payments</p>
        </div>
        <Link href="/bounties/new" className="oc-btn oc-btn-primary">+ Create Bounty</Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "Total Bounties", value: stats.total, color: "var(--oc-accent)" },
          { label: "Active", value: stats.active, color: "var(--oc-amber)" },
          { label: "Completed", value: stats.completed, color: "var(--oc-green)" },
          { label: "Total Paid", value: `$${stats.paid.toLocaleString()}`, color: "var(--oc-cyan)" },
        ].map((s) => (
          <div key={s.label} className="oc-stat-card">
            <div className="oc-stat-label">{s.label}</div>
            <div className="oc-stat-value" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 13, fontWeight: 700, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px", fontFamily: "var(--oc-font)" }}>Recent Bounties</h2>
      {loading ? (
        <div className="oc-card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : recent.length === 0 ? (
        <div className="oc-card">
          <div className="oc-empty-state">
            <div className="oc-empty-icon"></div>
            <div className="oc-empty-title">No bounties yet</div>
            <div className="oc-empty-sub">Create your first bounty to get started</div>
            <Link href="/bounties/new" className="oc-btn oc-btn-primary" style={{ marginTop: "16px" }}>+ Create Bounty</Link>
          </div>
        </div>
      ) : (
        <div className="oc-card" style={{ padding: "0", overflow: "hidden" }}>
          <table className="oc-table" style={{ fontFamily: "var(--oc-font)" }}>
            <thead>
              <tr><th style={{ fontFamily: "var(--oc-font)" }}>Title</th><th style={{ fontFamily: "var(--oc-font)" }}>Status</th><th style={{ fontFamily: "var(--oc-font)" }}>Reward</th><th style={{ fontFamily: "var(--oc-font)" }}>Created</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/bounties/${b.id}`} style={{ fontWeight: 600, color: "var(--oc-text)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>{b.title}</Link></td>
                  <td>
                    <span className={`oc-badge ${b.status === "open" ? "oc-badge-green" : b.status === "completed" ? "oc-badge-gray" : "oc-badge-amber"}`}>{b.status}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${b.reward_amount || 0}</td>
                  <td style={{ color: "var(--oc-text-muted)", fontSize: 12, fontFamily: "var(--oc-font)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
