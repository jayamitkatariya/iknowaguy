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
  const [role, setRole] = useState<"worker" | "admin">("worker");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name, role } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(role === "admin" ? "/dashboard" : "/browse");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{
            width: "48px", height: "48px", background: "var(--accent)",
            borderRadius: "14px", display: "inline-flex", alignItems: "center",
            justifyContent: "center", color: "white", fontWeight: 700, fontSize: "22px",
            marginBottom: "16px",
          }}>H</div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-0.03em" }}>Create your account</h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "8px" }}>Join HireAHuman and start earning</p>
        </div>

        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSignup}>
            <div className="form-group">
              <label className="label">Full Name</label>
              <input className="input" type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label className="label">I want to</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {(["worker", "admin"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRole(r)} style={{
                    padding: "16px", borderRadius: "var(--radius-sm)",
                    border: role === r ? "2px solid var(--accent)" : "1px solid var(--border)",
                    background: role === r ? "var(--accent-light)" : "var(--bg-card)",
                    cursor: "pointer", textAlign: "center",
                    transition: "all 200ms",
                  }}>
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{r === "worker" ? "👤" : "🤖"}</div>
                    <div style={{ fontSize: "14px", fontWeight: 600 }}>{r === "worker" ? "Work Tasks" : "Create Tasks"}</div>
                  </button>
                ))}
              </div>
            </div>
            {error && <p style={{ color: "var(--error)", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <div className="divider" />
          <p style={{ textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
