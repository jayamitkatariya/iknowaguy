"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserId, apiFetch } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const userId = getUserId();
      try {
        const authDataStr = localStorage.getItem('auth_data');
        if (authDataStr) {
          const authData = JSON.parse(authDataStr);
          const u = authData.user || {};
          if (!cancelled) {
            setUser(u);
            setName(u.email?.split("@")[0] || "");
            setEmail(u.email || "");
          }
        }

        try {
          const bRes = await apiFetch(`/api/bounties?assigned_human_id=${userId}&status=completed&limit=100`);
          if (!cancelled) setCompletedCount(bRes.meta?.total || (bRes.data || []).length);
        } catch {}
      } catch {}
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Profile</h1>
        <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Manage your account settings</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px" }}>
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "32px", textAlign: "center" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "rgba(22,163,74,0.1)",
            border: "2px solid rgba(22,163,74,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "28px", fontWeight: 700, color: "var(--oc-accent)",
            margin: "0 auto 16px", fontFamily: "var(--oc-font)",
          }}>
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "4px", fontFamily: "var(--oc-font)" }}>{name || "User"}</h2>
          <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", marginBottom: "24px", fontFamily: "var(--oc-font)" }}>{email}</p>

          <div style={{ height: "1px", background: "var(--oc-border)", margin: "0 0 24px" }} />

          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{completedCount}</p>
              <p style={{ fontSize: "11px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Completed</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${totalEarnings.toLocaleString()}</p>
              <p style={{ fontSize: "11px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Earned</p>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "28px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "24px", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Edit Profile
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: "8px", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--oc-bg-tertiary)", border: "1px solid var(--oc-border)",
                borderRadius: "6px", color: "var(--oc-text)",
                fontSize: "13px", fontFamily: "var(--oc-font)",
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "28px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: "8px", fontFamily: "var(--oc-font)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Email
            </label>
            <input
              value={email}
              disabled
              style={{
                width: "100%", padding: "10px 14px",
                background: "var(--oc-bg-tertiary)", border: "1px solid var(--oc-border)",
                borderRadius: "6px", color: "var(--oc-text-muted)",
                fontSize: "13px", fontFamily: "var(--oc-font)",
                outline: "none", boxSizing: "border-box", opacity: 0.6,
              }}
            />
          </div>

          <button
            disabled
            style={{
              padding: "10px 20px",
              background: "var(--oc-bg-tertiary)",
              color: "var(--oc-text-muted)",
              border: "1px solid var(--oc-border)",
              borderRadius: "6px",
              fontSize: "13px", fontWeight: 600,
              fontFamily: "var(--oc-font)",
            }}
          >
            Settings coming soon
          </button>
        </div>
      </div>
    </div>
  );
}
