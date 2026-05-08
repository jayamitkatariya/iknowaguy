"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyPlaintext, setApiKeyPlaintext] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchTenant = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: tenants } = await supabase
          .from("tenants")
          .select("*")
          .eq("contact_email", session.user.email)
          .limit(1);

        if (cancelled) return;

        if (tenants && tenants.length > 0) {
          const t = tenants[0];
          setTenantName(t.name || t.slug || "");
          const prefix = t.api_key_prefix || "";
          setApiKey(prefix ? `hah_${prefix}...` : null);
          setApiKeyPlaintext(t.api_key || null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load API key");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchTenant();
    return () => { cancelled = true; };
  }, []);

  const generateNewKey = async () => {
    setGenerating(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_key", email: session.user.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate key");

      setApiKeyPlaintext(data.api_key);
      setApiKey(`hah_${data.api_key_prefix}...`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>API Keys</h1>
        <p style={{ color: "var(--oc-text-muted)" }}>Your API key for programmatic access to HireAHuman</p>
      </header>

      <div className="oc-card" style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Your API Key</h2>
        {tenantName && (
          <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "1rem" }}>
            Organization: <strong style={{ color: "var(--oc-text)" }}>{tenantName}</strong>
          </p>
        )}
        {apiKeyPlaintext ? (
          <>
            <div className="oc-api-key-box" style={{ marginBottom: "0.75rem" }}>
              <code style={{ fontFamily: "monospace", fontSize: "0.875rem" }}>{apiKey}</code>
              <button onClick={() => copyToClipboard(apiKeyPlaintext)} className="oc-copy-btn">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button onClick={generateNewKey} disabled={generating} className="oc-btn oc-btn-ghost" style={{ fontSize: "0.8rem" }}>
              {generating ? "Generating..." : "Generate New Key"}
            </button>
          </>
        ) : (
          <div>
            <p style={{ color: "var(--oc-text-muted)", marginBottom: "1rem" }}>No API key yet.</p>
            <button onClick={generateNewKey} disabled={generating} className="oc-btn oc-btn-primary">
              {generating ? "Generating..." : "Generate API Key"}
            </button>
          </div>
        )}
        {error && (
          <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", color: "var(--oc-red)" }}>{error}</p>
        )}
        <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Keep this key secure. It provides full access to your organization's data.
        </p>
      </div>

      <div className="oc-card">
        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>How to Use</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.75rem" }}>
          Add to your Hermes, OpenClaw, or Claude Desktop config:
        </p>
        <div className="oc-api-key-box" style={{ marginBottom: "0.75rem" }}>
          <code style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
            {`{"command":"npx","args":["@hireahuman/mcp-server"],"env":{"HIREAHUMAN_API_KEY":"${apiKeyPlaintext || "YOUR_API_KEY"}"}}`}
          </code>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Or run directly: <code style={{ background: "var(--oc-bg-tertiary)", padding: "2px 6px", borderRadius: "4px" }}>npx @hireahuman/mcp-server</code>
        </p>
      </div>
    </div>
  );
}
