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
    const { data } = await supabase.from("team_members").select("*").order("created_at", { ascending: false });
    setMembers(data || []);
    setLoading(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from("team_members").insert({ email: inviteEmail, role: "viewer" });
    setInviteEmail("");
    fetchMembers();
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = { admin: "badge-success", manager: "badge-warning", viewer: "badge-neutral" };
    return map[role] || "badge-neutral";
  };

  return (
    <div>
      <div className="page-header">
        <h1>Team</h1>
        <p>Manage your team members and roles</p>
      </div>

      {/* Invite Form */}
      <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Invite Member</h3>
        <form onSubmit={handleInvite} style={{ display: "flex", gap: "12px" }}>
          <input className="input" type="email" placeholder="colleague@company.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required style={{ flex: 1 }} />
          <button type="submit" className="btn btn-primary">Send Invite</button>
        </form>
      </div>

      {/* Members List */}
      {loading ? (
        <div className="card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No team members yet</h3>
          <p>Invite your first team member above</p>
        </div>
      ) : (
        <div className="card-flat" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "50%",
                        background: "var(--accent-light)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: "14px", fontWeight: 700, color: "var(--accent)",
                      }}>{m.email?.charAt(0)?.toUpperCase() || "?"}</div>
                      <span style={{ fontWeight: 600 }}>{m.email}</span>
                    </div>
                  </td>
                  <td><span className={`badge ${roleBadge(m.role)}`}>{m.role}</span></td>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(m.created_at).toLocaleDateString()}</td>
                  <td><button className="btn btn-ghost btn-sm" style={{ color: "var(--text-secondary)" }}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
