"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchApiKeys(); }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userRes = await supabase.from("users").select("org_id").eq("id", session.user.id).single();
    const oid = userRes.data?.org_id;
    setOrgId(oid);

    if (oid) {
      const { data } = await supabase
        .from("api_keys")
        .select("*")
        .eq("org_id", oid)
        .order("created_at", { ascending: false });
      setApiKeys(data || []);
    }

    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newKeyName.trim()) return;

    setCreating(true);
    try {
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

      const { error } = await supabase.from("api_keys").insert({
        org_id: orgId,
        name: newKeyName.trim(),
        token,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (!error) {
        setNewKeyName("");
        setShowCreateForm(false);
        fetchApiKeys();
      }
    } catch (err) {
      console.error("Error creating API key:", err);
    }
    setCreating(false);
  };

  const handleCopy = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this API key? This cannot be undone.")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    fetchApiKeys();
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return "*".repeat(key.length);
    return key.slice(0, 6) + "*".repeat(20) + key.slice(-4);
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>API Keys</h1>
        <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Manage your API keys for programmatic access</p>
      </div>

      <div className="oc-card" style={{ marginBottom: "24px", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "4px", fontFamily: "var(--oc-font)" }}>REST API</h3>
            <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
              Base URL: <code style={{ color: "var(--oc-accent)", background: "rgba(245, 158, 11, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>http://localhost:3000</code>
            </p>
          </div>
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} className="oc-btn oc-btn-primary" style={{ fontSize: "12px" }}>
              + Create Key
            </button>
          ) : (
            <form onSubmit={handleCreate} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. Production)"
                required
                className="oc-input"
                style={{ width: "200px", fontSize: "12px" }}
              />
              <button type="submit" disabled={creating} className="oc-btn oc-btn-primary" style={{ fontSize: "12px" }}>
                {creating ? "..." : "Create"}
              </button>
              <button type="button" onClick={() => { setShowCreateForm(false); setNewKeyName(""); }} className="oc-btn oc-btn-ghost" style={{ fontSize: "12px" }}>
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "40px", textAlign: "center" }}>
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-text" />
          </div>
        ) : apiKeys.length === 0 ? (
          <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "64px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3, fontFamily: "var(--oc-font)" }}>⟨/⟩</div>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "8px", fontFamily: "var(--oc-font)" }}>No API keys yet</h3>
            <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
              Create an API key to access the REST API programmatically
            </p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div key={key.id} style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{key.name}</h3>
                    {key.expires_at && new Date(key.expires_at) < new Date() && (
                      <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)", fontFamily: "var(--oc-font)" }}>
                        Expired
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "monospace", letterSpacing: "0.02em" }}>
                    {copied === key.id ? (
                      <span style={{ color: "var(--oc-accent)" }}>Copied!</span>
                    ) : (
                      maskKey(key.token)
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleCopy(key.token, key.id)}
                    className="oc-btn oc-btn-ghost"
                    style={{ fontSize: "11px", padding: "6px 12px" }}
                  >
                    {copied === key.id ? "Copied!" : "Copy"}
                  </button>
                  <button
                    onClick={() => handleDelete(key.id)}
                    style={{
                      fontSize: "11px", padding: "6px 12px",
                      background: "transparent", border: "1px solid var(--oc-border)",
                      borderRadius: "6px", color: "var(--oc-text-muted)", cursor: "pointer",
                      fontFamily: "var(--oc-font)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div style={{ marginTop: "8px", fontSize: "11px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
                Created {new Date(key.created_at).toLocaleDateString()}
                {key.expires_at && ` · Expires ${new Date(key.expires_at).toLocaleDateString()}`}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
