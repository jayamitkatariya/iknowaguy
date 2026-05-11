"use client";

import { useState, useEffect } from "react";
import { getUserId, apiFetch } from "@/lib/api";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [connectStatus, setConnectStatus] = useState<{
    charges_enabled: boolean;
    payouts_enabled: boolean;
    details_submitted: boolean;
  } | null>(null);
  const [settingUpConnect, setSettingUpConnect] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchEarnings = async () => {
      setLoading(true);
      const userId = getUserId();
      if (!userId) { setLoading(false); return; }

      try {
        const bRes = await apiFetch(`/api/bounties?assigned_human_id=${userId}&status=completed&limit=100`);
        const completed = (bRes.data || []).map((b: any) => ({
          id: b.id,
          amount: b.reward_amount || 0,
          status: b.payment_status === "completed" ? "completed" : "pending",
          created_at: b.updated_at || b.created_at,
          description: b.title || "Bounty reward",
          type: "bounty_payment",
        }));
        if (!cancelled) setEarnings(completed);

        try {
          const humanRes = await apiFetch(`/api/humans/${userId}`);
          if (!cancelled && humanRes.data?.stripe_account_id) {
            setStripeAccountId(humanRes.data.stripe_account_id);
          }
        } catch {}
      } catch {}
      if (!cancelled) setLoading(false);
    };
    fetchEarnings();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!stripeAccountId) return;
    const fetchConnectStatus = async () => {
      try {
        const res = await apiFetch(`/api/connect/account-status/${stripeAccountId}`);
        if (res.data) {
          setConnectStatus({
            charges_enabled: res.data.charges_enabled,
            payouts_enabled: res.data.payouts_enabled,
            details_submitted: res.data.details_submitted,
          });
        }
      } catch {}
    };
    fetchConnectStatus();
  }, [stripeAccountId]);

  const handleSetupStripeConnect = async () => {
    setSettingUpConnect(true);
    try {
      const userId = getUserId();
      if (!userId) return;

      const createRes = await apiFetch("/api/connect/account", {
        method: "POST",
        body: JSON.stringify({ human_id: userId, email: "" }),
      });

      const accountId = createRes.data?.stripe_account_id;
      if (!accountId) { setSettingUpConnect(false); return; }

      const refreshUrl = `${window.location.origin}/earnings`;
      const returnUrl = `${window.location.origin}/earnings?connected=true`;

      const linkRes = await apiFetch("/api/connect/account-link", {
        method: "POST",
        body: JSON.stringify({ human_id: userId, refresh_url: refreshUrl, return_url: returnUrl }),
      });

      if (linkRes.data?.url) {
        window.location.href = linkRes.data.url;
      }
    } catch {} finally {
      setSettingUpConnect(false);
    }
  };

  const total = earnings.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pending = earnings.filter((p) => p.status !== "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const thisMonth = earnings.filter((p) => {
    const d = new Date(p.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const [justConnected, setJustConnected] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      setJustConnected(urlParams.get("connected") === "true");
    }
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Earnings</h1>
        <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Track your payouts and pending payments</p>
      </div>

      {!loading && !stripeAccountId && (
        <div style={{
          background: "linear-gradient(135deg, #635bff 0%, #7c3aed 100%)",
          border: "1px solid rgba(99, 91, 255, 0.3)",
          borderRadius: "12px", padding: "24px", marginBottom: "32px", color: "white",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
            <div style={{ fontSize: "32px" }}>💳</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px", fontFamily: "var(--oc-font)" }}>
                Set up Stripe Connect to receive payouts
              </h3>
              <p style={{ fontSize: "13px", opacity: 0.9, marginBottom: "16px", fontFamily: "var(--oc-font)", lineHeight: 1.5 }}>
                Link your bank account or debit card through Stripe to receive your task earnings directly.
              </p>
              <button onClick={handleSetupStripeConnect} disabled={settingUpConnect}
                style={{ background: "white", color: "#635bff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 600, cursor: settingUpConnect ? "not-allowed" : "pointer", fontFamily: "var(--oc-font)", opacity: settingUpConnect ? 0.7 : 1 }}>
                {settingUpConnect ? "Setting up..." : "Set up payouts"}
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && justConnected && stripeAccountId && connectStatus?.details_submitted && (
        <div style={{ background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.3)", borderRadius: "12px", padding: "16px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>✅</span>
          <p style={{ fontSize: "13px", color: "var(--oc-accent)", fontFamily: "var(--oc-font)", fontWeight: 500 }}>Stripe Connect account set up complete! You can now receive payouts.</p>
        </div>
      )}

      {!loading && stripeAccountId && !connectStatus?.details_submitted && (
        <div style={{ background: "rgba(217, 119, 6, 0.1)", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "12px", padding: "16px 24px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>⏳</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", color: "var(--oc-amber)", fontFamily: "var(--oc-font)", fontWeight: 500, marginBottom: "4px" }}>Stripe onboarding incomplete</p>
            <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Complete your Stripe setup to receive payouts.</p>
          </div>
          <button onClick={handleSetupStripeConnect} disabled={settingUpConnect}
            style={{ background: "var(--oc-amber)", color: "white", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "12px", fontWeight: 600, cursor: settingUpConnect ? "not-allowed" : "pointer", fontFamily: "var(--oc-font)", opacity: settingUpConnect ? 0.7 : 1 }}>
            {settingUpConnect ? "Loading..." : "Continue setup"}
          </button>
        </div>
      )}

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

      {!loading && stripeAccountId && connectStatus && (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "16px 20px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>💳</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>Stripe Connect</span>
          </div>
          <div style={{ display: "flex", gap: "12px", flex: 1 }}>
            {[
              { label: "Charges", enabled: connectStatus.charges_enabled },
              { label: "Payouts", enabled: connectStatus.payouts_enabled },
              { label: "Verified", enabled: connectStatus.details_submitted },
            ].map((item) => (
              <span key={item.label} style={{
                fontSize: "11px", fontWeight: 500, padding: "3px 8px", borderRadius: "4px",
                background: item.enabled ? "rgba(22,163,74,0.1)" : "rgba(217,119,6,0.1)",
                color: item.enabled ? "var(--oc-accent)" : "var(--oc-amber)",
                border: `1px solid ${item.enabled ? "rgba(22,163,74,0.3)" : "rgba(217,119,6,0.3)"}`,
                fontFamily: "var(--oc-font)",
              }}>
                {item.label}: {item.enabled ? "Yes" : "No"}
              </span>
            ))}
          </div>
        </div>
      )}

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
                  <td style={{ padding: "14px 16px", fontSize: "13px", color: "var(--oc-text)", fontWeight: 500 }}>
                    {p.description || "Task payment"}
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: "13px", fontWeight: 700, color: "var(--oc-accent)" }}>${p.amount || 0}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "4px",
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
