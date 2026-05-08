"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any[]>([]);
  const [recentBounties, setRecentBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      const apiKey = getCookie("hah_api_key");
      const tenantId = getCookie("hah_tenant_id");

      if (!apiKey || !tenantId) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      try {
        // Fetch bounties
        const res = await fetch(`${apiUrl}/api/bounties?limit=10`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch bounties");
        const result = await res.json();
        const bounties = result.data || [];

        // Calculate stats
        const active = bounties.filter(
          (b: any) => b.status === "open" || b.status === "in_progress"
        ).length;
        const completed = bounties.filter(
          (b: any) => b.status === "completed" || b.status === "approved"
        ).length;
        const totalSpent = bounties
          .filter((b: any) => b.status === "completed" || b.status === "approved")
          .reduce((sum: number, b: any) => sum + (b.reward_amount || 0), 0);

        setStats([
          { label: "Active Bounties", value: active.toString(), change: "" },
          { label: "Completed Tasks", value: completed.toString(), change: "" },
          {
            label: "Total Spent",
            value: `$${totalSpent.toFixed(2)}`,
            change: "",
          },
          { label: "Active Workers", value: "—", change: "" },
        ]);

        setRecentBounties(
          bounties.slice(0, 5).map((b: any) => ({
            id: b.id,
            title: b.title,
            status: b.status,
            workers: b.assigned_human_id ? 1 : 0,
            reward: `$${b.reward_amount || 0}`,
          }))
        );
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Dashboard</h1>
          <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
        </header>
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

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {stats.map((stat, i) => (
          <div key={i} className="oc-card">
            <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.5rem" }}>
              {stat.label}
            </p>
            <p style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
              {stat.value}
            </p>
            {stat.change && <p style={{ fontSize: "0.75rem", color: "var(--oc-accent)" }}>{stat.change}</p>}
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <Link href="/bounties/new" className="oc-btn oc-btn-primary">
          + Create New Bounty
        </Link>
        <Link href="/bounties" className="oc-btn oc-btn-ghost">
          View All Bounties
        </Link>
        <Link href="/api-keys" className="oc-btn oc-btn-ghost">
          Manage API Keys
        </Link>
      </div>

      {/* Recent Bounties */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "600" }}>Recent Bounties</h2>
          <Link href="/bounties" style={{ color: "var(--oc-accent)", fontSize: "0.875rem" }}>
            View all →
          </Link>
        </div>

        <div className="oc-card" style={{ padding: 0, overflow: "hidden" }}>
          {recentBounties.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--oc-text-muted)" }}>
              No bounties yet. <Link href="/bounties/new" style={{ color: "var(--oc-accent)" }}>Create one</Link>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--oc-border)" }}>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Workers</th>
                  <th style={{ textAlign: "left", padding: "1rem", fontSize: "0.75rem", color: "var(--oc-text-muted)", textTransform: "uppercase" }}>Reward</th>
                </tr>
              </thead>
              <tbody>
                {recentBounties.map((bounty) => (
                  <tr key={bounty.id} style={{ borderBottom: "1px solid var(--oc-border)" }}>
                    <td style={{ padding: "1rem" }}>
                      <Link href={`/bounties/${bounty.id}`} style={{ color: "var(--oc-text)", fontWeight: 500 }}>
                        {bounty.title}
                      </Link>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <span className={`oc-badge ${bounty.status === "open" || bounty.status === "in_progress" ? "oc-badge-green" : ""}`}>
                        {bounty.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--oc-text-muted)" }}>
                      {bounty.workers}
                    </td>
                    <td style={{ padding: "1rem", fontWeight: 500 }}>
                      {bounty.reward}
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
