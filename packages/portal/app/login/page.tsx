"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    // Use the API's /auth/login endpoint to get an API key
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Login failed");
      setLoading(false);
      return;
    }
    const { data } = json;
    // Store API key in localStorage for apiFetch to use
    localStorage.setItem("api_key", data.api_key);
    // Also sign in with Supabase for user session
    const { error: sbError } = await supabase.auth.signInWithPassword({ email, password });
    if (sbError) {
      // API login succeeded, Supabase session is optional
      console.warn("Supabase session login failed:", sbError.message);
    }
    // Check user role and redirect
    if (data.user?.role === "agent" || data.user?.role === "admin") {
      router.push("/dashboard/bounties");
    } else {
      router.push("/worker/browse");
    }
  };

  return (
    <div className="oc-card" style={{ padding: "32px" }}>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            color: "var(--oc-text-muted)",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>Email</label>
          <input
            type="email"
            className="oc-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label style={{
            display: "block",
            color: "var(--oc-text-muted)",
            fontSize: "12px",
            fontWeight: 700,
            marginBottom: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}>Password</label>
          <input
            type="password"
            className="oc-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p style={{ color: "var(--oc-red)", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          className="oc-btn oc-btn-primary"
          disabled={loading}
          style={{ width: "100%", padding: "14px 24px", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div style={{ height: "1px", background: "var(--oc-border)", margin: "24px 0" }} />

      <p style={{ textAlign: "center", fontSize: "13px", color: "var(--oc-text-muted)" }}>
        Don't have an account?{" "}
        <Link href="/signup" style={{ color: "var(--oc-accent)", fontWeight: 600 }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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
              width: "36px",
              height: "36px",
              background: "var(--oc-accent)",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <span style={{ color: "#fff", fontWeight: 700, fontSize: "18px" }}>H</span>
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
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <h1 className="oc-page-title">Welcome back</h1>
            <p className="oc-page-subtitle">Sign in to your account</p>
          </div>

          <Suspense fallback={
            <div className="oc-card" style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
