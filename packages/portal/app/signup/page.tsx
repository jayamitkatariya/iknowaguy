"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") || "";
  
  const [step, setStep] = useState<"role" | "details">(initialRole ? "details" : "role");
  const [role, setRole] = useState<"worker" | "agent">(initialRole === "agent" ? "agent" : "worker");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRoleSelect = (selectedRole: "worker" | "agent") => {
    setRole(selectedRole);
    setStep("details");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      if (role === "worker") {
        // Insert human_profiles for worker
        await supabase.from("human_profiles").insert({
          id: data.user.id,
          full_name: name,
          email: email,
          is_available: true,
          verification_status: "pending",
          role: "worker",
        });
        await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          role: "worker",
        });
        router.push("/worker/browse");
      } else {
        // For agent, insert into organizations + users
        // The agent would typically create an org, but for simplicity we'll just set role
        await supabase.from("human_profiles").insert({
          id: data.user.id,
          full_name: name,
          email: email,
          role: "agent",
        });
        await supabase.from("users").insert({
          id: data.user.id,
          email: email,
          role: "agent",
        });
        router.push("/dashboard/bounties");
      }
    } else {
      setError("Signup succeeded but no user returned. Check your email for confirmation.");
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <div className="oc-card" style={{ padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 className="oc-page-title" style={{ marginBottom: "12px" }}>What do you want to do?</h1>
          <p className="oc-page-subtitle">Choose how you want to use HireAHuman</p>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <button
            onClick={() => handleRoleSelect("worker")}
            className="oc-card"
            style={{
              padding: "28px",
              textAlign: "left",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--oc-accent-border)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "var(--oc-accent-dim)",
                border: "1px solid var(--oc-accent-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}>
                [$]
              </div>
              <div>
                <h3 style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--oc-text-strong)",
                  marginBottom: "6px",
                  fontFamily: "var(--oc-font)",
                }}>
                  Find Work
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "var(--oc-text-muted)",
                  fontFamily: "var(--oc-font)",
                  lineHeight: 1.5,
                }}>
                  Browse tasks, complete bounties, and earn money as a human worker
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleRoleSelect("agent")}
            className="oc-card"
            style={{
              padding: "28px",
              textAlign: "left",
              cursor: "pointer",
              border: "2px solid transparent",
              transition: "all 200ms ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "rgba(6, 182, 212, 0.3)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                background: "rgba(6, 182, 212, 0.1)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}>
                [*]
              </div>
              <div>
                <h3 style={{
                  fontSize: "17px",
                  fontWeight: 700,
                  color: "var(--oc-text-strong)",
                  marginBottom: "6px",
                  fontFamily: "var(--oc-font)",
                }}>
                  Hire Workers
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "var(--oc-text-muted)",
                  fontFamily: "var(--oc-font)",
                  lineHeight: 1.5,
                }}>
                  Post bounties, manage workers, and scale your human workforce via API
                </p>
              </div>
            </div>
          </button>
        </div>

        <div style={{ height: "1px", background: "var(--oc-border)", margin: "28px 0" }} />

        <p style={{ textAlign: "center", fontSize: "13px", color: "var(--oc-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--oc-accent)", fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="oc-card" style={{ padding: "32px" }}>
      <button
        onClick={() => setStep("role")}
        style={{
          background: "none",
          border: "none",
          color: "var(--oc-text-muted)",
          fontSize: "12px",
          cursor: "pointer",
          marginBottom: "20px",
          fontFamily: "var(--oc-font)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: "24px" }}>
        <p style={{
          fontSize: "12px",
          color: "var(--oc-accent)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "4px",
          fontFamily: "var(--oc-font)",
        }}>
          {role === "worker" ? "Worker Account" : "Agent Account"}
        </p>
        <h1 className="oc-page-title">Create your account</h1>
      </div>

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
  );
}

export default function SignupPage() {
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
            }}>HireAHuman</span>
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
        <div style={{ width: "100%", maxWidth: "480px" }}>
          <Suspense fallback={
            <div className="oc-card" style={{ padding: "32px", textAlign: "center" }}>
              <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
            </div>
          }>
            <SignupForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
