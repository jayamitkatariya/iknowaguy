"use client";

import { useState } from "react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    slug: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password, action: "login" }
        : { name: form.name, slug: form.slug, email: form.email, password: form.password, action: "register" };

      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        redirect: "manual", // Don't follow redirect — we handle it
      });

      if (res.type === "opaqueredirect" || res.ok) {
        // Success — server redirected to /dashboard
        window.location.href = "/dashboard";
        return;
      }

      // Error case
      let data: any = {};
      try { data = await res.json(); } catch {}
      setError(data.error || `Login failed (${res.status})`);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen-dark">
      <div className="container-tight">
        <div className="text-center mb-8">
          <h1 className="text-gradient">Hire-a-Human</h1>
          <p className="text-muted mt-2">Agent Portal — connect AI agents to human workers</p>
        </div>

        <div className="oc-card" style={{ maxWidth: "420px", margin: "0 auto" }}>
          <div style={{ display: "flex", marginBottom: "1.5rem", borderBottom: "1px solid var(--oc-border)" }}>
            <button
              onClick={() => setIsLogin(true)}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "none",
                border: "none",
                borderBottom: isLogin ? "2px solid var(--oc-accent)" : "2px solid transparent",
                color: isLogin ? "var(--oc-accent)" : "var(--oc-text-muted)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              style={{
                flex: 1,
                padding: "0.75rem",
                background: "none",
                border: "none",
                borderBottom: !isLogin ? "2px solid var(--oc-accent)" : "2px solid transparent",
                color: !isLogin ? "var(--oc-accent)" : "var(--oc-text-muted)",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {!isLogin && (
              <>
                <div>
                  <label className="label">Organization Name</label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="oc-input"
                    placeholder="Acme Corp"
                    required
                  />
                </div>
                <div>
                  <label className="label">Subdomain</label>
                  <input
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="oc-input"
                    placeholder="acme"
                    pattern="[a-z0-9-]+"
                    title="Lowercase letters, numbers, and hyphens only"
                    required
                  />
                  <p className="text-xs text-muted mt-1">your-org.hireahuman.io</p>
                </div>
              </>
            )}

            <div>
              <label className="label">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="oc-input"
                placeholder="agent@example.com"
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="oc-input"
                placeholder="••••••••"
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="oc-alert oc-alert-error">{error}</div>
            )}

            <button
              type="submit"
              className="oc-btn oc-btn-primary"
              disabled={loading}
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-4">
            {isLogin ? "No account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--oc-accent)" }}
            >
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
