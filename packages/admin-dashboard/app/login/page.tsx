"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1e", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 16, padding: 40, width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#818cf8", letterSpacing: "-0.02em", marginBottom: 4 }}>HireAHuman</div>
          <div style={{ fontSize: 14, color: "#6b7280" }}>Admin Dashboard</div>
        </div>

        {error && (
          <div style={{ padding: "10px 14px", background: "#2d0a0a", border: "1px solid #7f1d1d", borderRadius: 8, color: "#fca5a5", fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#9ca3af", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#f9fafb", padding: "10px 12px", fontSize: 14, boxSizing: "border-box" }}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: loading ? "#374151" : "#6366f1", color: loading ? "#6b7280" : "#fff", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4, transition: "background 0.15s" }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
