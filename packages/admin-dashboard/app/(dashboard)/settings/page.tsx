"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface TenantSettings {
  name: string;
  contact_email: string;
  api_key: string;
  api_key_prefix: string;
  settings: {
    notifications?: {
      email?: boolean;
      slack?: boolean;
      telegram?: boolean;
      email_address?: string;
      slack_webhook?: string;
      telegram_bot_token?: string;
    };
    payment_provider?: string;
    stripe_account_id?: string;
  };
}

export default function AdminSettingsPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [settings, setSettings] = useState<TenantSettings>({
    name: "",
    contact_email: "",
    api_key: "",
    api_key_prefix: "",
    settings: {
      notifications: {
        email: false,
        slack: false,
        telegram: false,
        email_address: "",
        slack_webhook: "",
        telegram_bot_token: "",
      },
      payment_provider: "none",
      stripe_account_id: "",
    },
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: userData } = await supabase
        .from("users")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const tid = userData?.tenant_id;
      if (!tid) { setLoading(false); return; }
      setTenantId(tid);

      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, name, contact_email, api_key, api_key_prefix, settings")
        .eq("id", tid)
        .single();

      if (tenant) {
        setSettings({
          name: tenant.name || "",
          contact_email: tenant.contact_email || "",
          api_key: tenant.api_key || "",
          api_key_prefix: tenant.api_key_prefix || "",
          settings: {
            notifications: {
              email: tenant.settings?.notifications?.email ?? false,
              slack: tenant.settings?.notifications?.slack ?? false,
              telegram: tenant.settings?.notifications?.telegram ?? false,
              email_address: tenant.settings?.notifications?.email_address ?? "",
              slack_webhook: tenant.settings?.notifications?.slack_webhook ?? "",
              telegram_bot_token: tenant.settings?.notifications?.telegram_bot_token ?? "",
            },
            payment_provider: tenant.settings?.payment_provider || "none",
            stripe_account_id: tenant.settings?.stripe_account_id || "",
          },
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setToast(null);

    const payload = {
      name: settings.name,
      contact_email: settings.contact_email,
      settings: {
        notifications: settings.settings.notifications,
        payment_provider: settings.settings.payment_provider,
        stripe_account_id: settings.settings.stripe_account_id,
      },
    };

    const { error } = await supabase
      .from("tenants")
      .update(payload)
      .eq("id", tenantId);

    if (error) {
      setToast({ type: "error", message: error.message });
    } else {
      setToast({ type: "success", message: "Settings saved successfully!" });
    }
    setSaving(false);
    setTimeout(() => setToast(null), 4000);
  };

  const maskKey = (key: string) => {
    if (!key || key.length < 12) return key;
    return key.slice(0, 12) + "•".repeat(Math.max(0, key.length - 12));
  };

  const handleCopy = () => {
    if (!settings.api_key) return;
    navigator.clipboard.writeText(settings.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNotification = (channel: "email" | "slack" | "telegram") => {
    setSettings((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        notifications: {
          ...prev.settings.notifications,
          [channel]: !prev.settings.notifications?.[channel],
        },
      },
    }));
  };

  const updateNotificationField = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        notifications: {
          ...prev.settings.notifications,
          [field]: value,
        },
      },
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: "24px 32px", maxWidth: 680, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div className="loading-state">
          <div className="loading-state-icon">⏳</div>
          <div>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 680, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .page-title { font-size: 22px; font-weight: 700; color: #f9fafb; margin-bottom: 24px }
        .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 20px }
        .section-title { font-size: 14px; font-weight: 700; color: #f9fafb; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #374151 }
        .form-group { margin-bottom: 16px }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #9ca3af; margin-bottom: 6px }
        .form-input { width: 100%; background: #111827; border: 1px solid #374151; border-radius: 8px; color: #f9fafb; padding: 10px 12px; font-size: 14px; box-sizing: border-box }
        .form-input:focus { outline: none; border-color: #6366f1 }
        .form-select { width: 100%; background: #111827; border: 1px solid #374151; border-radius: 8px; color: #f9fafb; padding: 10px 12px; font-size: 14px; box-sizing: border-box }
        .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none }
        .btn-primary { background: #6366f1; color: white }
        .btn-primary:hover { background: #4f46e5 }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed }
        .saved-msg { font-size: 13px; color: #34d399; margin-left: 12px }
        .error-msg { font-size: 13px; color: #f87171; margin-left: 12px }
        .channel-note { font-size: 11px; color: #6b7280; margin-top: 4px }
        .toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px }
        .toggle-label { font-size: 13px; font-weight: 600; color: #d1d5db }
        .toggle { width: 40px; height: 22px; border-radius: 999px; background: #374151; position: relative; cursor: pointer; transition: background 0.2s; border: none; padding: 0 }
        .toggle.on { background: #6366f1 }
        .toggle-knob { width: 18px; height: 18px; border-radius: 50%; background: #f9fafb; position: absolute; top: 2px; left: 2px; transition: transform 0.2s }
        .toggle.on .toggle-knob { transform: translateX(18px) }
        .api-key-box { background: #111827; border: 1px solid #374151; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: ui-monospace, monospace; font-size: 13px; color: #9ca3af }
        .copy-btn { background: #1f2937; border: 1px solid #374151; color: #d1d5db; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer }
        .copy-btn:hover { background: #374151 }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast-container" style={{ top: 80 }}>
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✓" : "⚠"} {toast.message}
          </div>
        </div>
      )}

      <h1 className="page-title">Settings</h1>

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="section-title">General</div>
          <div className="form-group">
            <label className="form-label">Tenant Name</label>
            <input
              className="form-input"
              type="text"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              className="form-input"
              type="email"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
            />
          </div>
        </div>

        <div className="card">
          <div className="section-title">Notification Channels</div>

          <div className="toggle-row">
            <span className="toggle-label">Email notifications</span>
            <button type="button" className={`toggle ${settings.settings.notifications?.email ? "on" : ""}`} onClick={() => toggleNotification("email")}>
              <span className="toggle-knob" />
            </button>
          </div>
          {settings.settings.notifications?.email && (
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                value={settings.settings.notifications?.email_address || ""}
                onChange={(e) => updateNotificationField("email_address", e.target.value)}
                placeholder="alerts@company.com"
              />
            </div>
          )}

          <div className="toggle-row">
            <span className="toggle-label">Slack notifications</span>
            <button type="button" className={`toggle ${settings.settings.notifications?.slack ? "on" : ""}`} onClick={() => toggleNotification("slack")}>
              <span className="toggle-knob" />
            </button>
          </div>
          {settings.settings.notifications?.slack && (
            <div className="form-group">
              <label className="form-label">Slack Webhook URL</label>
              <input
                className="form-input"
                type="url"
                value={settings.settings.notifications?.slack_webhook || ""}
                onChange={(e) => updateNotificationField("slack_webhook", e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
              <div className="channel-note">Receive bounty alerts in your Slack channel</div>
            </div>
          )}

          <div className="toggle-row">
            <span className="toggle-label">Telegram notifications</span>
            <button type="button" className={`toggle ${settings.settings.notifications?.telegram ? "on" : ""}`} onClick={() => toggleNotification("telegram")}>
              <span className="toggle-knob" />
            </button>
          </div>
          {settings.settings.notifications?.telegram && (
            <div className="form-group">
              <label className="form-label">Telegram Bot Token</label>
              <input
                className="form-input"
                type="text"
                value={settings.settings.notifications?.telegram_bot_token || ""}
                onChange={(e) => updateNotificationField("telegram_bot_token", e.target.value)}
                placeholder="123456:ABC-DEF..."
              />
              <div className="channel-note">Send updates directly to a Telegram chat or channel</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Payment Provider</div>
          <div className="form-group">
            <label className="form-label">Provider</label>
            <select
              className="form-select"
              value={settings.settings.payment_provider}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, payment_provider: e.target.value },
                }))
              }
            >
              <option value="none">None (Internal Use — no payments)</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          {settings.settings.payment_provider === "stripe" && (
            <div className="form-group">
              <label className="form-label">Stripe Account ID</label>
              <input
                className="form-input"
                type="text"
                value={settings.settings.stripe_account_id || ""}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, stripe_account_id: e.target.value },
                  }))
                }
                placeholder="acct_..."
              />
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title">API Key</div>
          <div className="api-key-box">
            <span>{maskKey(settings.api_key)}</span>
            <button type="button" className="copy-btn" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <div className="channel-note" style={{ marginTop: 8 }}>
            Use this key to authenticate MCP server requests.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", paddingTop: 4 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
          {toast && toast.type === "success" && <span className="saved-msg">✓ {toast.message}</span>}
          {toast && toast.type === "error" && <span className="error-msg">⚠ {toast.message}</span>}
        </div>
      </form>
    </div>
  );
}
