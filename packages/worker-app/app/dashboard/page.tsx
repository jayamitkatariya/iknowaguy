"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({ active: 0, completed: 0, totalSpent: 0, workers: 0 });
  const [recentBounties, setRecentBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchDashboard = async () => {
      try {
        const { data: bounties, error: bErr } = await supabase
          .from("bounties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (bErr) throw new Error(bErr.message);
        if (cancelled) return;

        const list = bounties || [];
        const active = list.filter((b: any) =>
          b.status === "open" || b.status === "in_progress" || b.status === "accepted"
        ).length;
        const completed = list.filter((b: any) =>
          b.status === "completed" || b.status === "approved"
        ).length;
        const totalSpent = list
          .filter((b: any) => b.status === "completed" || b.status === "approved")
          .reduce((sum: number, b: any) => sum + (b.reward_amount || 0), 0);

        setStats({ active, completed, totalSpent, workers: 0 });
        setRecentBounties(list.slice(0, 5));
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Dashboard</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          {[1,2,3,4].map((i) => (
            <div key={i} className="oc-card" style={{ padding: "1.5rem" }}>
              <div className="skeleton skeleton-text" style={{ width: "60%" }} />
              <div className="skeleton skeleton-title" style={{ height: "28px", width: "40%", marginTop: "8px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--oc-text-muted)" }}>
          Manage your bounties and monitor your human workforce
        </p>
      </header>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", color: "var(--oc-red)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        <div className="oc-card">
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>Active Bounties</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.active}</p>
        </div>
        <div className="oc-card">
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>Completed Tasks</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.completed}</p>
        </div>
        <div className="oc-card">
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>Total Spent</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>${stats.totalSpent.toFixed(2)}</p>
        </div>
        <div className="oc-card">
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>Active Workers</p>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>—</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary">
          + Create New Bounty
        </Link>
        <Link href="/dashboard/bounties" className="oc-btn oc-btn-ghost">
          View All Bounties
        </Link>
        <Link href="/dashboard/api-keys" className="oc-btn oc-btn-ghost">
          Manage API Keys
        </Link>
        <Link href="/browse" className="oc-btn oc-btn-ghost">
          Worker Marketplace
        </Link>
      </div>

      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Recent Bounties</h2>
          <Link href="/dashboard/bounties" style={{ color: "var(--oc-accent)", fontSize: "0.875rem" }}>
            View all →
          </Link>
        </div>

        <div className="oc-card" style={{ padding: 0, overflow: "hidden" }}>
          {recentBounties.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--oc-text-muted)" }}>
              No bounties yet. <Link href="/dashboard/bounties/new" style={{ color: "var(--oc-accent)" }}>Create one</Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--oc-border)" }}>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Worker</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Reward</th>
                </tr>
              </thead>
              <tbody>
                {recentBounties.map((bounty) => (
                  <tr key={bounty.id} style={{ borderBottom: "1px solid var(--oc-border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <Link href={`/dashboard/bounties/${bounty.id}`} style={{ color: "var(--oc-text)", fontWeight: 500, textDecoration: "none" }}>
                        {bounty.title}
                      </Link>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`oc-badge ${bounty.status === "open" || bounty.status === "in_progress" ? "oc-badge-green" : bounty.status === "completed" ? "oc-badge-green" : "oc-badge-amber"}`}>
                        {bounty.status?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--oc-text-muted)" }}>
                      {bounty.assigned_human_id ? "Assigned" : "Open"}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>
                      ${bounty.reward_amount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
