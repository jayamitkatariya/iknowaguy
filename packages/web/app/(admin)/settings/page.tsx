"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    contact_email: "",
    commission_rate: "",
    default_currency: "USD",
    description: "",
  });

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (error) {
      console.error(error);
    } else if (data) {
      setTenant(data);
      setForm({
        name: data.name || "",
        slug: data.slug || "",
        contact_email: data.contact_email || "",
        commission_rate: data.commission_rate != null ? String(data.commission_rate) : "",
        default_currency: data.default_currency || "USD",
        description: data.description || "",
      });
    }
    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setSaving(true);
    const { error } = await supabase
      .from("tenants")
      .update({
        name: form.name,
        slug: form.slug,
        contact_email: form.contact_email,
        commission_rate: form.commission_rate ? parseFloat(form.commission_rate) : null,
        default_currency: form.default_currency,
        description: form.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id);

    if (error) {
      console.error(error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
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
          Settings
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Manage your platform settings
        </p>
      </div>

      {loading ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          Loading...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "32px",
            maxWidth: "640px",
          }}
        >
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Tenant Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Acme Corp"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Slug
            </label>
            <input
              name="slug"
              value={form.slug}
              onChange={handleChange}
              placeholder="acme-corp"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Contact Email
            </label>
            <input
              name="contact_email"
              type="email"
              value={form.contact_email}
              onChange={handleChange}
              placeholder="admin@example.com"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Commission Rate (%)
              </label>
              <input
                name="commission_rate"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={form.commission_rate}
                onChange={handleChange}
                placeholder="10"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Default Currency
              </label>
              <select
                name="default_currency"
                value={form.default_currency}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                  color: "var(--text-primary)",
                  appearance: "none",
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236B705C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: "36px",
                  cursor: "pointer",
                  transition: "border-color 150ms ease, box-shadow 150ms ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="CAD">CAD</option>
                <option value="AUD">AUD</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of your organization"
              rows={4}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                resize: "vertical",
                minHeight: "100px",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: "var(--accent)",
                color: "white",
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                opacity: saving ? 0.6 : 1,
                transition: "all 150ms ease",
              }}
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            {saved && (
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--success)",
                }}
              >
                Saved successfully
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
