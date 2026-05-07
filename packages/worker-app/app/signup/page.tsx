"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role: "human" } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.user) {
      // Insert human_profiles
      await supabase.from("human_profiles").insert({
        id: data.user.id,
        full_name: name,
        email: email,
        is_available: true,
        verification_status: "pending",
      });
      // Insert users
      await supabase.from("users").insert({
        id: data.user.id,
        email: email,
        role: "human",
      });
      router.push("/browse");
    } else {
      setError("Signup succeeded but no user returned. Check your email for confirmation.");
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
          <a href="/browse" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
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
            }}>HireAHuman</span>
          </a>
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
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 className="oc-page-title">Create your account</h1>
            <p className="oc-page-subtitle">Join HireAHuman and start earning</p>
          </div>

          <div className="oc-card" style={{ padding: "32px" }}>
            <form onSubmit={handleSignup}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: "var(--oc-text-muted)",
                  fontSize: "12px",
                  fontWeight: 700,
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}>Full Name</label>
                <input
                  type="text"
                  className="oc-input"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  minLength={8}
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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div style={{ height: "1px", background: "var(--oc-border)", margin: "24px 0" }} />

            <p style={{ textAlign: "center", fontSize: "13px", color: "var(--oc-text-muted)" }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--oc-accent)", fontWeight: 600 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
