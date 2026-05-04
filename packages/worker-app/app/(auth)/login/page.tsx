"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #374151",
  background: "#0a0f1e",
  color: "#f9fafb",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  marginTop: 6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 13,
  fontWeight: 600,
  color: "#9ca3af",
  marginBottom: 2,
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 0",
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  color: "white",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 8,
};

export default function LoginPage() {
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

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/browse");
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#f9fafb", margin: 0 }}>Sign in</h2>

      {error && (
        <div style={{
          padding: "10px 14px",
          fontSize: 13,
          color: "#fca5a5",
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.2)",
          borderRadius: 8,
        }}>
          {error}
        </div>
      )}

      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com" />
      </div>

      <div>
        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••" />
      </div>

      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
        {loading ? "Signing in..." : "Sign in"}
      </button>

      <p style={{ textAlign: "center", fontSize: 13, color: "#6b7280", margin: 0 }}>
        Don&apos;t have an account?{" "}
        <Link href="/signup" style={{ color: "#818cf8", fontWeight: 600 }}>Sign up</Link>
      </p>
    </form>
  );
}
