"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEarnings(); }, []);

  const fetchEarnings = async () => {
    setLoading(true);
    const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
    setEarnings(data || []);
    setLoading(false);
  };

  const total = earnings.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pending = earnings.filter((p) => p.status === "pending").reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonth = earnings.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Earnings</h1>
        <p>Track your payouts and pending payments</p>
      </div>

      <div className="grid-3" style={{ marginBottom: "40px" }}>
        {[
          { label: "Total Earned", value: `$${total.toLocaleString()}`, change: "+12% from last month", positive: true },
          { label: "Pending", value: `$${pending.toLocaleString()}`, change: "Awaiting approval", positive: false },
          { label: "This Month", value: `$${thisMonth.toLocaleString()}`, change: "Current billing cycle", positive: true },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="label">{s.label}</p>
            <p className="value">{s.value}</p>
            <p className={`change ${s.positive ? "positive" : "negative"}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "20px" }}>Transaction History</h2>

      {loading ? (
        <div className="card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" /></div>
      ) : earnings.length === 0 ? (
        <div className="empty-state">
          <div className="icon">💰</div>
          <h3>No earnings yet</h3>
          <p>Complete tasks to start earning</p>
        </div>
      ) : (
        <div className="card-flat" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {earnings.map((p) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{p.description || "Task payment"}</td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>${p.amount || 0}</td>
                  <td><span className={`badge ${p.status === "completed" ? "badge-success" : "badge-warning"}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
