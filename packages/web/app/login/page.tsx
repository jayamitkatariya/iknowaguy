'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/browse";
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              background: "var(--accent)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: 700,
              fontSize: "24px",
              margin: "0 auto 20px",
            }}
          >
            H
          </div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              marginBottom: "8px",
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
            }}
          >
            Sign in to your HireAHuman account
          </p>
        </div>

        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
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

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "#F8D7DA",
                  borderRadius: "8px",
                  fontSize: "13px",
                  color: "var(--error)",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--accent)",
                color: "white",
                border: "1px solid var(--accent)",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 150ms ease",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "20px",
              borderTop: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
              Don&apos;t have an account?{" "}
              <a
                href="/signup"
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  transition: "color 150ms ease",
                }}
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
