"use client";

import { useState } from "react";

const tabs = ["General", "Notifications", "Billing", "API Keys"];

export default function SettingsPage() {
  const [tab, setTab] = useState("General");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => { setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }, 500);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
        <p>Configure your account and workspace</p>
      </div>

      <div className="tab-list" style={{ marginBottom: "32px" }}>
        {tabs.map((t) => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "General" && (
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Workspace Settings</h3>
          <div className="form-group">
            <label className="label">Workspace Name</label>
            <input className="input" defaultValue="My Workspace" />
          </div>
          <div className="form-group">
            <label className="label">Default Currency</label>
            <select className="select" defaultValue="USD">
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Timezone</label>
            <select className="select" defaultValue="America/New_York">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      )}

      {tab === "Notifications" && (
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Notification Preferences</h3>
          {["New bounty submission", "Bounty approved", "Payment released", "New team member"].map((item) => (
            <div key={item} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "16px 0", borderBottom: "1px solid var(--border)",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 500 }}>{item}</span>
              <div style={{ display: "flex", gap: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" defaultChecked /> Email
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                  <input type="checkbox" defaultChecked /> Slack
                </label>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ marginTop: "24px" }} onClick={handleSave}>Save Preferences</button>
        </div>
      )}

      {tab === "Billing" && (
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Billing</h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>Manage your subscription and payment methods</p>
          <div style={{
            padding: "24px", borderRadius: "var(--radius-md)",
            background: "var(--accent-light)", border: "1px solid var(--accent)",
            marginBottom: "24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent)" }}>Free Plan</p>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>10 bounties/month</p>
              </div>
              <button className="btn btn-primary btn-sm">Upgrade to Pro</button>
            </div>
          </div>
          <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Payment Method</h4>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No payment method added yet.</p>
        </div>
      )}

      {tab === "API Keys" && (
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>API Keys</h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>Use API keys to integrate HireAHuman with your AI agents</p>
          <div style={{
            padding: "16px 20px", borderRadius: "var(--radius-sm)",
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "14px",
            marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>hah_live_••••••••••••••••</span>
            <button className="btn btn-ghost btn-sm">Copy</button>
          </div>
          <button className="btn btn-secondary">Generate New Key</button>
        </div>
      )}
    </div>
  );
}
