"use client";

import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = getCookie("hah_api_key");
    const name = getCookie("hah_tenant_name");
    setApiKey(key ? `hah_${key.slice(0, 4)}...${key.slice(-4)}` : null);
    setTenantName(name);
    setLoading(false);
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            API Keys
          </h1>
          <p style={{ color: "var(--oc-text-muted)" }}>
            Your API key for programmatic access to the iknowaguy API
          </p>
        </div>
      </header>

      {/* API Key Display */}
      <div className="oc-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Your API Key</h2>
        {tenantName && (
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "1rem" }}>
            Organization: <strong style={{ color: "var(--oc-text)" }}>{tenantName}</strong>
          </p>
        )}
        {apiKey ? (
          <div className="oc-api-key-box">
            <code style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{apiKey}</code>
            <button
              onClick={() => copyToClipboard(getCookie("hah_api_key") || "")}
              className="oc-copy-btn"
            >
              Copy
            </button>
          </div>
        ) : (
          <p style={{ color: "var(--oc-text-muted)" }}>
            No API key found. Please{" "}
            <a href="/login" style={{ color: "var(--oc-accent)" }}>login</a> to generate one.
          </p>
        )}
        <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Keep this key secure. It provides full access to your organization's data.
        </p>
      </div>

      {/* API Documentation Link */}
      <div style={{ padding: "1.5rem", background: "var(--oc-surface)", border: "1px solid var(--oc-border)", borderRadius: "8px" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Need Help?</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "1rem" }}>
          Check out our API documentation for integration guides and endpoint references.
        </p>
        <a href="/api" className="oc-btn oc-btn-ghost" style={{ display: "inline-flex" }}>
          View API Documentation
        </a>
      </div>
    </div>
  );
}
