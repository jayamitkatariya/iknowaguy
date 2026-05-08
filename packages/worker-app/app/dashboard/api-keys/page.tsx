"use client";

import { useState, useEffect } from "react";

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
    const loadApiKey = async () => {
      try {
        const storedKey = localStorage.getItem('api_key');
        const authDataStr = localStorage.getItem('auth_data');
        
        if (cancelled) return;

        if (storedKey) {
          setApiKeyPlaintext(storedKey);
          // Show masked version: first 20 chars + "..."
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
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load API key");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadApiKey();
    return () => { cancelled = true; };
  }, []);

  const generateNewKey = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '' }),
      });

      // If we have stored auth data, use it to get the current user info
      const authDataStr = localStorage.getItem('auth_data');
      if (authDataStr) {
        const authData = JSON.parse(authDataStr);
        if (authData.user?.email) {
          const loginRes = await fetch('http://localhost:3001/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: authData.user.email, password: '' }),
          });
          if (loginRes.ok) {
            const loginData = await loginRes.json();
            if (loginData.data?.api_key) {
              localStorage.setItem('api_key', loginData.data.api_key);
              localStorage.setItem('auth_data', JSON.stringify(loginData.data));
              setApiKeyPlaintext(loginData.data.api_key);
              setApiKey(loginData.data.api_key.length > 20 ? loginData.data.api_key.substring(0, 20) + "..." : loginData.data.api_key);
            }
          }
        }
      }
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
            {`{"command":"npx","args":["@iknowaguy/mcp-server"],"env":{"IKNOWAGUY_API_KEY":"${apiKeyPlaintext || "YOUR_API_KEY"}"}}`}
          </code>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
          Or run directly: <code style={{ background: "var(--oc-bg-tertiary)", padding: "2px 6px", borderRadius: "4px" }}>npx @iknowaguy/mcp-server</code>
        </p>
      </div>
    </div>
  );
}