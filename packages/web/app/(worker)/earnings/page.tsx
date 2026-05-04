"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EarningsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    const paymentsData = data || [];
    setPayments(paymentsData);

    setStats({
      total: paymentsData.reduce((sum, p) => sum + (p.amount || 0), 0),
      pending: paymentsData
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
      paid: paymentsData
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    });
    setLoading(false);
  };

  const statCards = [
    { label: "Total Earned", value: stats.total, color: "var(--text-primary)" },
    { label: "Pending", value: stats.pending, color: "var(--warning)" },
    { label: "Paid", value: stats.paid, color: "var(--success)" },
  ];

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
          Earnings
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Track your payments and withdrawal history
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {statCards.map((stat) => (
          <div
            key={stat.label}
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
                color: stat.color,
                letterSpacing: "-0.03em",
                marginBottom: "4px",
              }}
            >
              ${stat.value.toFixed(2)}
            </div>
            <div
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                margin: 0,
              }}
            >
              {stat.label}
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
                {["Task", "Date", "Amount", "Status"].map((header) => (
                  <th
                    key={header}
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
                    {header}
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
              ) : payments.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No payment history yet
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id}>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {payment.task_name || "Task"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      ${(payment.amount || 0).toFixed(2)}
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
                          background:
                            payment.status === "paid"
                              ? "var(--accent-light)"
                              : "#FFF3CD",
                          color:
                            payment.status === "paid"
                              ? "var(--success)"
                              : "#856404",
                        }}
                      >
                        {payment.status}
                      </span>
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
