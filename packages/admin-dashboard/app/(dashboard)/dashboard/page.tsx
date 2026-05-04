"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Bounty {
  id: string;
  title: string;
  status: string;
  reward_amount: number;
  currency: string;
  created_at: string;
}

interface Stats {
  total: number;
  open: number;
  active: number;
  completed: number;
  revenue: number;
}

const statCards = [
  { label: "Total Bounties", key: "total", color: "#818cf8", sub: "All time" },
  { label: "Open", key: "open", color: "#34d399", sub: "Available now" },
  { label: "Active", key: "active", color: "#f59e0b", sub: "In progress" },
  { label: "Completed", key: "completed", color: "#10b981", sub: "Finished" },
  { label: "Revenue", key: "revenue", color: "#6366f1", sub: "Total rewards" },
];

function formatCurrency(amount: number, currency?: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    open: "badge-green",
    assigned: "badge-blue",
    submitted: "badge-amber",
    completed: "badge-blue",
    paid: "badge-green",
    disputed: "badge-red",
    cancelled: "badge-gray",
  };
  return map[status] || "badge-gray";
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, open: 0, active: 0, completed: 0, revenue: 0 });
  const [recentBounties, setRecentBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [totalR, openR, activeR, completedR, recentR] = await Promise.all([
        supabase.from("bounties").select("id", { count: "exact", head: true }),
        supabase.from("bounties").select("id", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("bounties").select("id", { count: "exact", head: true }).in("status", ["assigned", "submitted"]),
        supabase.from("bounties").select("id", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("bounties").select("id, title, status, reward_amount, currency, created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      const revenue = (recentR.data || []).reduce((sum: number, b: any) => sum + (b.reward_amount || 0), 0);

      setStats({
        total: totalR.count || 0,
        open: openR.count || 0,
        active: activeR.count || 0,
        completed: completedR.count || 0,
        revenue,
      });
      setRecentBounties(recentR.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="page-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your HireAHuman deployment</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        {statCards.map((s) => {
          const value = s.key === "revenue" ? formatCurrency((stats as any)[s.key]) : String((stats as any)[s.key]);
          return (
            <div key={s.key} className="card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color }}>{loading ? "—" : value}</div>
              <div className="stat-sub">{s.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/bounties/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Bounty
        </Link>
        <Link href="/team" className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Add Team Member
        </Link>
        <Link href="/settings" className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Settings
        </Link>
      </div>

      {/* Recent Bounties */}
      <div>
        <div className="section-title">Recent Bounties</div>
        {loading ? (
          <div className="card">
            {[1, 2, 3].map((i) => (
              <div key={i} className="activity-item">
                <div className="skeleton skeleton-circle" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : recentBounties.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No bounties yet</div>
            <div className="empty-state-sub">Create your first bounty to get started.</div>
          </div>
        ) : (
          <div className="activity-list">
            {recentBounties.map((b) => (
              <Link key={b.id} href={`/bounties/${b.id}`} className="activity-item" style={{ textDecoration: "none" }}>
                <div className="activity-icon" style={{ background: "#1e1b4b" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className="activity-content">
                  <div className="activity-title">{b.title}</div>
                  <div className="activity-meta">{new Date(b.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span className={`badge ${statusBadgeClass(b.status)}`}>{b.status}</span>
                  <div className="activity-amount">{formatCurrency(b.reward_amount, b.currency)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
