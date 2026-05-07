"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const tabs = ["General", "Notifications", "Billing", "API Keys"];

const defaultNotifications = {
  bounty_submission: { email: true, slack: true },
  bounty_approved: { email: true, slack: true },
  payment_released: { email: true, slack: true },
  new_team_member: { email: true, slack: true },
};

const notificationLabels: Record<string, string> = {
  bounty_submission: "New bounty submission",
  bounty_approved: "Bounty approved",
  payment_released: "Payment released",
  new_team_member: "New team member",
};

export default function SettingsPage() {
  const [tab, setTab] = useState("General");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceName, setWorkspaceName] = useState("My Workspace");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      const tid = session.user.user_metadata?.tenant_id || session.user.user_metadata?.tenantId;
      if (tid) {
        setTenantId(tid);
        const { data } = await supabase.from("tenants").select("settings, name").eq("id", tid).single();
        if (data) {
          setWorkspaceName(data.name || "My Workspace");
          if (data.settings) {
            setCurrency(data.settings.default_currency || "USD");
            setTimezone(data.settings.timezone || "America/New_York");
            if (data.settings.notifications) {
              setNotifications({ ...defaultNotifications, ...data.settings.notifications });
            }
            if (data.settings.api_key) {
              setApiKey(data.settings.api_key);
            }
          }
        }
      }
      setLoading(false);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (!tenantId) return;
    setSaving(true);
    const settings = {
      workspace_name: workspaceName,
      default_currency: currency,
      timezone,
      notifications,
      ...(apiKey ? { api_key: apiKey } : {}),
    };
    await supabase.from("tenants").update({ settings, name: workspaceName }).eq("id", tenantId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleGenerateKey = async () => {
    const { data, error } = await supabase.rpc("generate_api_key");
    if (data) {
      setApiKey(data);
      if (tenantId) {
        await supabase.from("tenants").update({ settings: { workspace_name: workspaceName, default_currency: currency, timezone, notifications, api_key: data } }).eq("id", tenantId);
      }
    } else {
      alert("API key generation is not yet available. Please contact support.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
        <p style={{ fontSize: 13, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", marginBottom: 4 }}>Settings</h1>
        <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Configure your account and workspace</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 32, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button key={t} className={`oc-btn ${tab === t ? "oc-btn-primary" : "oc-btn-ghost"}`} onClick={() => setTab(t)} style={{ fontSize: 12 }}>{t}</button>
        ))}
      </div>

      {tab === "General" && (
        <div className="oc-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--oc-text)", marginBottom: 24, fontFamily: "var(--oc-font)" }}>Workspace Settings</h3>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Workspace Name</label>
            <input className="oc-input" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} style={{ fontFamily: "var(--oc-font)" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Default Currency</label>
            <select className="oc-input" value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ fontFamily: "var(--oc-font)" }}>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Timezone</label>
            <select className="oc-input" value={timezone} onChange={(e) => setTimezone(e.target.value)} style={{ fontFamily: "var(--oc-font)" }}>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <button className="oc-btn oc-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="oc-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--oc-text)", marginBottom: 24, fontFamily: "var(--oc-font)" }}>Notification Preferences</h3>
          {Object.entries(notificationLabels).map(([key, label]) => (
            <div key={key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 0", borderBottom: "1px solid var(--oc-border)",
              fontFamily: "var(--oc-font)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{label}</span>
              <div style={{ display: "flex", gap: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
                  <input type="checkbox" checked={notifications[key]?.email ?? true} onChange={(e) => { const prev = notifications[key] || { email: true, slack: true }; setNotifications({ ...notifications, [key]: { ...prev, email: e.target.checked } }); }} style={{ accentColor: "var(--oc-accent)" }} /> Email
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
                  <input type="checkbox" checked={notifications[key]?.slack ?? true} onChange={(e) => { const prev = notifications[key] || { email: true, slack: true }; setNotifications({ ...notifications, [key]: { ...prev, slack: e.target.checked } }); }} style={{ accentColor: "var(--oc-accent)" }} /> Slack
                </label>
              </div>
            </div>
          ))}
          <button className="oc-btn oc-btn-primary" style={{ marginTop: 24 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Preferences"}
          </button>
        </div>
      )}

      {tab === "Billing" && (
        <div className="oc-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--oc-text)", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Billing</h3>
          <p style={{ fontSize: 13, color: "var(--oc-text-muted)", marginBottom: 24, fontFamily: "var(--oc-font)" }}>Manage your subscription and payment methods</p>
          <div style={{
            padding: 24, borderRadius: "var(--oc-radius)",
            background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
            marginBottom: 24, fontFamily: "var(--oc-font)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>Free Plan</p>
                <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>10 bounties/month</p>
              </div>
              <button className="oc-btn oc-btn-primary" style={{ fontSize: 12 }} onClick={() => alert("Coming soon")}>Upgrade to Pro</button>
            </div>
          </div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: "var(--oc-text)", marginBottom: 12, fontFamily: "var(--oc-font)" }}>Payment Method</h4>
          <p style={{ fontSize: 13, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>No payment method added yet.</p>
        </div>
      )}

      {tab === "API Keys" && (
        <div className="oc-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--oc-text)", marginBottom: 8, fontFamily: "var(--oc-font)" }}>API Keys</h3>
          <p style={{ fontSize: 13, color: "var(--oc-text-muted)", marginBottom: 24, fontFamily: "var(--oc-font)" }}>Use API keys to integrate HireAHuman with your AI agents</p>
          {apiKey && (
            <div className="oc-api-key-box" style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--oc-font)", fontSize: 13, color: "var(--oc-text-muted)" }}>{apiKey.substring(0, 8)}••••••••••••••••</span>
              <button className="oc-copy-btn" onClick={() => { navigator.clipboard.writeText(apiKey); }}>Copy</button>
            </div>
          )}
          {!apiKey && (
            <div className="oc-api-key-box" style={{ marginBottom: 16 }}>
              <span style={{ fontFamily: "var(--oc-font)", fontSize: 13, color: "var(--oc-text-muted)" }}>No API key generated yet</span>
            </div>
          )}
          <button className="oc-btn oc-btn-ghost" onClick={handleGenerateKey}>Generate New Key</button>
        </div>
      )}
    </div>
  );
}