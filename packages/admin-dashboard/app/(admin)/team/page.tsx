"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase.from("users").select("*").eq("role", "agent").order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("users").insert({ email: inviteEmail, role: "viewer" });
    setInviteEmail("");
    fetchMembers();
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: "oc-badge-cyan", manager: "oc-badge-amber", viewer: "oc-badge-gray" };
    return map[role] || "oc-badge-gray";
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", marginBottom: 4 }}>Team</h1>
        <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Manage your team members and roles</p>
      </div>

      {/* Invite Form */}
      <div className="oc-card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--oc-text)", marginBottom: 16, fontFamily: "var(--oc-font)" }}>Invite Member</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input className="oc-input" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required style={{ flex: 1, minWidth: 200, fontFamily: "var(--oc-font)" }} />
          <button type="submit" className="oc-btn oc-btn-primary">Send Invite</button>
        </form>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="oc-card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : members.length === 0 ? (
        <div className="oc-card">
          <div className="oc-empty-state">
            <div className="oc-empty-icon"></div>
            <div className="oc-empty-title">No team members yet</div>
            <div className="oc-empty-sub">Invite your first team member above</div>
          </div>
        </div>
      ) : (
        <div className="oc-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="oc-table" style={{ fontFamily: "var(--oc-font)" }}>
            <thead>
              <tr><th style={{ fontFamily: "var(--oc-font)" }}>Member</th><th style={{ fontFamily: "var(--oc-font)" }}>Role</th><th style={{ fontFamily: "var(--oc-font)" }}>Joined</th><th style={{ fontFamily: "var(--oc-font)" }}>Actions</th></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
                        display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 14, fontWeight: 700, color: "var(--oc-accent)",
                        fontFamily: "var(--oc-font)",
                      }}>{m.email?.charAt(0)?.toUpperCase() || "?"}</div>
                      <span style={{ fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{m.email}</span>
                    </div>
                  </td>
                  <td><span className={`oc-badge ${roleBadge(m.role)}`}>{m.role}</span></td>
                  <td style={{ color: "var(--oc-text-muted)", fontSize: 12, fontFamily: "var(--oc-font)" }}>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td><button className="oc-btn oc-btn-ghost" style={{ fontSize: 11 }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
