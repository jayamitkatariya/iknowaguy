"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const userId = session.user.id;
      const { data } = await supabase.from("payment_transactions").select("*").eq("human_id", userId).order("created_at", { ascending: false });
      setEarnings(data || []);
      setLoading(false);
    };
    fetchEarnings();
  }, []);

  const total = earnings.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pending = earnings.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonth = earnings.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Earnings</h1>
        <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Track your payouts and pending payments</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "40px" }}>
        {[
          { label: "Total Earned", value: `$${total.toLocaleString()}`, sub: "+all time" },
          { label: "Pending", value: `$${pending.toLocaleString()}`, sub: "awaiting approval" },
          { label: "This Month", value: `$${thisMonth.toLocaleString()}`, sub: "current cycle" },
        ].map((s) => (
          <div key={s.label} style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "20px" }}>
            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", fontFamily: "var(--oc-font)" }}>{s.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-accent)", marginBottom: "4px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>{s.value}</p>
            <p style={{ fontSize: "11px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "16px", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Transaction History</h2>

      {loading ? (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", height: "180px", padding: "20px" }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      ) : earnings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 24px" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>[]</div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "8px", fontFamily: "var(--oc-font)" }}>No earnings yet</h3>
          <p style={{ fontSize: "13px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Complete tasks to start earning</p>
        </div>
      ) : (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--oc-font)" }}>
            <thead>
              <tr>
                {["Date", "Description", "Amount", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontWeight: 600, color: "var(--oc-accent)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--oc-border)", background: "var(--oc-bg-tertiary)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {earnings.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--oc-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--oc-bg-tertiary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--oc-text-muted)" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--oc-text)", fontWeight: 500 }}>{p.description || "Task payment"}</td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "var(--oc-accent)" }}>${p.amount || 0}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "3px 10px", borderRadius: "4px",
                      background: p.status === "completed" ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)",
                      color: p.status === "completed" ? "var(--oc-accent)" : "var(--oc-amber)",
                      border: `1px solid ${p.status === "completed" ? "rgba(22,163,74,0.3)" : "rgba(217,119,6,0.3)"}`,
                      fontFamily: "var(--oc-font)",
                    }}>
                      {p.status}
                    </span>
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