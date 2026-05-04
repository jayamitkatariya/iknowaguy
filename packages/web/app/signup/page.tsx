'use client';

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
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
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "var(--accent-light)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            Check your email
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            We sent a confirmation link to {email}. Click it to activate your
            account.
          </p>
          <a
            href="/login"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "var(--accent)",
              color: "white",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

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
            Create your account
          </h1>
          <p
            style={{
              fontSize: "15px",
              color: "var(--text-secondary)",
            }}
          >
            Start hiring humans or complete bounties today
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
          <form onSubmit={handleSignup}>
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
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
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
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
              {loading ? "Creating account..." : "Create Account"}
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
              Already have an account?{" "}
              <a
                href="/login"
                style={{
                  color: "var(--accent)",
                  fontWeight: 600,
                  transition: "color 150ms ease",
                }}
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
