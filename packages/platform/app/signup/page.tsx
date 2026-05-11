"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<"worker" | "agent">("worker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const orgSlugFinal = orgSlug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const orgNameFinal = orgName || name;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgNameFinal || name,
          slug: orgSlugFinal,
          email,
          password,
          role: role === "agent" ? "admin" : "human",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      if (data.data?.api_key) {
        localStorage.setItem('api_key', data.data.api_key);
        localStorage.setItem('auth_data', JSON.stringify(data.data));
        
        // Redirect based on role
        if (role === "agent") {
          router.push("/dashboard");
        } else {
          router.push("/browse");
        }
      } else {
        throw new Error('No API key received');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--oc-bg)",
      fontFamily: "var(--oc-font)",
      color: "var(--oc-text)",
    }}>
      <header style={{
        background: "var(--oc-bg-secondary)",
        borderBottom: "1px solid var(--oc-border)",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <nav style={{
          maxWidth: "56rem",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
            <div style={{
              width: "36px", height: "36px",
              background: "var(--oc-accent)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: "#000", fontWeight: 700, fontSize: "18px" }}>H</span>
            </div>
            <span style={{
              color: "var(--oc-text-strong)",
              fontSize: "15px",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}>iknowaguy</span>
          </Link>
        </nav>
      </header>

      <main style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "460px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 className="oc-page-title">Create your account</h1>
            <p className="oc-page-subtitle">Join iknowaguy</p>
          </div>

          <div className="oc-card" style={{ padding: "32px" }}>
            <div style={{ display: "flex", marginBottom: "1.5rem", borderBottom: "1px solid var(--oc-border)" }}>
              <button
                onClick={() => setRole("worker")}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "none", border: "none",
                  borderBottom: role === "worker" ? "2px solid var(--oc-accent)" : "2px solid transparent",
                  color: role === "worker" ? "var(--oc-accent)" : "var(--oc-text-muted)",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}
              >
                I want to work
              </button>
              <button
                onClick={() => setRole("agent")}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "none", border: "none",
                  borderBottom: role === "agent" ? "2px solid var(--oc-accent)" : "2px solid transparent",
                  color: role === "agent" ? "var(--oc-accent)" : "var(--oc-text-muted)",
                  cursor: "pointer", fontWeight: 600, fontSize: "0.875rem",
                }}
              >
                I have an AI agent
              </button>
            </div>

            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "var(--oc-text-muted)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Full Name
                </label>
                <input type="text" className="oc-input" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              {role === "agent" && (
                <>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", color: "var(--oc-text-muted)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Organization Name
                    </label>
                    <input type="text" className="oc-input" placeholder="Acme Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", color: "var(--oc-text-muted)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      Organization Slug
                    </label>
                    <input type="text" className="oc-input" placeholder="acme" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} pattern="[a-z0-9-]+" />
                  </div>
                </>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", color: "var(--oc-text-muted)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Email
                </label>
                <input type="email" className="oc-input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", color: "var(--oc-text-muted)", fontSize: "12px", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Password
                </label>
                <input type="password" className="oc-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              </div>

              {error && (
                <p style={{ color: "var(--oc-red)", fontSize: "13px", marginBottom: "16px" }}>{error}</p>
              )}

              <button type="submit" className="oc-btn oc-btn-primary" disabled={loading} style={{ width: "100%", padding: "14px 24px", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Creating account..." : role === "agent" ? "Create Agent Account" : "Create Worker Account"}
              </button>
            </form>

            <div style={{ height: "1px", background: "var(--oc-border)", margin: "24px 0" }} />

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--oc-text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--oc-accent)", fontWeight: 600 }}>Sign in</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}