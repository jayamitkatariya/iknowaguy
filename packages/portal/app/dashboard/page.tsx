"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface Bounty {
  id: string;
  title: string;
  reward_amount: number;
  status: string;
  created_at: string;
  category?: string;
  task_count?: number;
}

export default function DashboardPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [stats, setStats] = useState({ active: 0, total_earned: 0, workers: 0, pending_approval: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const orgRes = await supabase
        .from("users")
        .select("org_id")
        .eq("id", session.user.id)
        .single();

      const orgId = orgRes.data?.org_id;

      if (orgId) {
        const bountyRes = await apiFetch(`/bounties?org_id=${orgId}&limit=5`);
        const bountyData = bountyRes.data || [];
        setBounties(bountyData);

        const active = bountyData.filter((b: Bounty) => b.status === "open" || b.status === "in_progress").length;
        const pending = bountyData.filter((b: Bounty) => b.status === "submitted" || b.status === "pending_review").length;

        setStats({
          active,
          total_earned: 0,
          workers: active,
          pending_approval: pending,
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }

    setLoading(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Dashboard</h1>
        <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Overview of your bounty program</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "40px" }}>
        {[
          { label: "Active Bounties", value: stats.active, sub: "open & in progress", icon: "◎" },
          { label: "Pending Approval", value: stats.pending_approval, sub: "awaiting review", icon: "◷" },
          { label: "Total Earned", value: `$${stats.total_earned.toLocaleString()}`, sub: "worker payouts", icon: "◇" },
          { label: "Workers", value: stats.workers, sub: "active contributors", icon: "◈" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--oc-font)" }}>{s.label}</p>
              <span style={{ fontSize: "18px", opacity: 0.5 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "var(--oc-text-muted)", marginTop: "4px", fontFamily: "var(--oc-font)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>Recent Bounties</h2>
        <Link href="/dashboard/bounties/new" style={{
          fontSize: "12px", fontWeight: 500, color: "var(--oc-accent)", textDecoration: "none",
          background: "rgba(245, 158, 11, 0.1)", padding: "6px 12px", borderRadius: "6px",
          fontFamily: "var(--oc-font)",
        }}>
          + New Bounty
        </Link>
      </div>

      {loading ? (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "40px", textAlign: "center" }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      ) : bounties.length === 0 ? (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px", opacity: 0.3 }}>◎</div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)" }}>No bounties yet</h3>
          <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", marginBottom: "20px", fontFamily: "var(--oc-font)" }}>Create your first bounty to start hiring workers</p>
          <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary" style={{ fontSize: "12px" }}>
            Create Bounty
          </Link>
        </div>
      ) : (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--oc-font)" }}>
            <thead>
              <tr>
                {["Title", "Reward", "Status", "Created"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--oc-accent)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--oc-border)", background: "var(--oc-bg-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bounties.map((b) => (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--oc-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--oc-bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 500, color: "var(--oc-text)" }}>
                    <Link href={`/dashboard/bounties/${b.id}`} style={{ color: "inherit", textDecoration: "none" }}>{b.title}</Link>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--oc-accent)", fontWeight: 600 }}>${b.reward_amount}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "3px 10px", borderRadius: "4px",
                      background: b.status === "open" ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)",
                      color: b.status === "open" ? "#16a34a" : "var(--oc-amber)",
                      border: `1px solid ${b.status === "open" ? "rgba(22,163,74,0.3)" : "rgba(217,119,6,0.3)"}`,
                      fontFamily: "var(--oc-font)",
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "12px", color: "var(--oc-text-muted)" }}>
                    {new Date(b.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
