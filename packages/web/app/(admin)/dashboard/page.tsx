"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    active: 0,
    completed: 0,
    revenue: 0,
  });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const { data: bounties } = await supabase
      .from("bounties")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const all = bounties || [];
    const total = all.length;
    const open = all.filter((b) => b.status === "open").length;
    const active = all.filter((b) => b.status === "active").length;
    const completed = all.filter(
      (b) => b.status === "completed" || b.status === "closed"
    ).length;
    const revenue = all.reduce((sum, b) => sum + (b.reward || 0), 0);

    setStats({ total, open, active, completed, revenue });
    setRecent(all.slice(0, 5));
    setLoading(false);
  };

  const statCards = [
    { label: "Total Bounties", value: stats.total },
    { label: "Open", value: stats.open },
    { label: "Active", value: stats.active },
    { label: "Completed", value: stats.completed },
    { label: "Revenue", value: `$${stats.revenue.toLocaleString()}` },
  ];

  const statusStyle = (status: string) => {
    const map: Record<string, React.CSSProperties> = {
      open: { background: "var(--accent-light)", color: "var(--accent)" },
      active: { background: "#FFF3CD", color: "#856404" },
      completed: { background: "var(--accent-light)", color: "var(--success)" },
      closed: { background: "var(--bg-elevated)", color: "var(--text-secondary)" },
    };
    return map[status] || map.closed;
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Overview of your platform
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {statCards.map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              transition: "box-shadow 150ms ease",
            }}
          >
            <div
              style={{
                fontSize: "32px",
                fontWeight: 600,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
                marginBottom: "4px",
              }}
            >
              {loading ? (
                <div
                  style={{
                    height: "32px",
                    width: "60%",
                    background: "var(--bg-elevated)",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
              ) : (
                s.value
              )}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Recent Bounties
          </h2>
          <Link
            href="/bounties"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--accent)",
              textDecoration: "none",
            }}
          >
            View all
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "14px",
              minWidth: "500px",
            }}
          >
            <thead>
              <tr>
                {["Title", "Status", "Reward", "Created"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-secondary)",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-elevated)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No bounties yet
                  </td>
                </tr>
              ) : (
                recent.map((b) => (
                  <tr key={b.id}>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Link
                        href={`/bounties/${b.id}`}
                        style={{
                          color: "var(--text-primary)",
                          textDecoration: "none",
                          fontWeight: 500,
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLAnchorElement).style.color =
                            "var(--accent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLAnchorElement).style.color =
                            "var(--text-primary)";
                        }}
                      >
                        {b.title}
                      </Link>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 500,
                          ...statusStyle(b.status),
                        }}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      ${b.reward}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
