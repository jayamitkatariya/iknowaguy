"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function ApiKeysPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyPlaintext, setApiKeyPlaintext] = useState<string | null>(null);
  const [tenantName, setTenantName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadApiKey = async () => {
      try {
        const storedKey = localStorage.getItem('api_key');
        const authDataStr = localStorage.getItem('auth_data');
        
        if (cancelled) return;

        if (storedKey) {
          setApiKeyPlaintext(storedKey);
          setApiKey(storedKey.length > 20 ? storedKey.substring(0, 20) + "..." : storedKey);
        }
        
        if (authDataStr) {
          try {
            const authData = JSON.parse(authDataStr);
            if (authData.tenant) {
              setTenantName(authData.tenant.name || authData.tenant.slug || "");
            }
          } catch {}
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadApiKey();
    return () => { cancelled = true; };
  }, []);

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
        <p style={{ color: "var(--oc-text-muted)" }}>Your API key for programmatic access to iknowaguy</p>
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
            <p style={{ fontSize: "0.8rem", color: "var(--oc-text-muted)" }}>
              To regenerate your API key, please contact support or sign out and sign back in.
            </p>
          </>
        ) : (
          <div>
            <p style={{ color: "var(--oc-text-muted)", marginBottom: "1rem" }}>No API key found. Please sign in again.</p>
          </div>
        )}
        <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Keep this key secure. It provides full access to your organization's data.
        </p>
      </div>

      <div className="oc-card">
        <h3 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "0.5rem" }}>How to Use</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)", marginBottom: "0.75rem" }}>
          Add to your Claude Desktop, Cursor, or OpenClaw MCP config:
        </p>
        <div className="oc-api-key-box" style={{ marginBottom: "0.75rem" }}>
          <code style={{ fontSize: "0.8rem", whiteSpace: "pre-wrap" }}>
            {`{"mcpServers":{"iknowaguy":{"command":"iknowaguy","args":["start"]}}}`}
          </code>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Or run: <code style={{ background: "var(--oc-bg-tertiary)", padding: "2px 6px", borderRadius: "4px" }}>npm install -g @iknowaguy/cli && iknowaguy start</code>
        </p>
      </div>
    </div>
  );
}
