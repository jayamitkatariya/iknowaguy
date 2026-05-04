"use client";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    async function fetchMembers() {
      const { data } = await supabase
        .from("human_profiles")
        .select("*, users:user_id(email)")
        .order("created_at", { ascending: false });
      setMembers(data || []);
    }
    fetchMembers();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    alert("Team invite would be sent to: " + email);
    setEmail(""); setName("");
    setAdding(false);
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100, margin: "0 auto", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .page-title { font-size: 22px; font-weight: 700; color: #f9fafb; margin-bottom: 24px }
        .card { background: #1f2937; border: 1px solid #374151; border-radius: 12px; padding: 24px; margin-bottom: 20px }
        .card-title { font-size: 14px; font-weight: 700; color: #f9fafb; margin-bottom: 16px }
        .form-row { display: flex; gap: 12px; align-items: flex-end }
        .form-group { display: flex; flex-direction: column; gap: 4px }
        .form-label { font-size: 12px; font-weight: 600; color: #9ca3af }
        .form-input { background: #111827; border: 1px solid #374151; border-radius: 8px; color: #f9fafb; padding: 8px 12px; font-size: 13px }
        .form-input:focus { outline: none; border-color: #6366f1 }
        .btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: none }
        .btn-primary { background: #6366f1; color: white }
        .btn-primary:hover { background: #4f46e5 }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed }
        .table { width: 100%; border-collapse: collapse }
        .table th { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 16px; text-align: left; border-bottom: 1px solid #374151 }
        .table td { padding: 14px 16px; font-size: 13px; color: #d1d5db; border-bottom: 1px solid #1f2937 }
        .table tr:last-child td { border-bottom: none }
        .badge { display: "inline-block"; padding: "2px 8px"; border-radius: 6px; font-size: 11px; font-weight: 600 }
        .badge-green { background: #064e3b; color: #34d399 }
        .badge-red { background: #4a1515; color: #f87171 }
      `}</style>

      <h1 className="page-title">Team Members</h1>

      <div className="card">
        <div className="card-title">Add Team Member</div>
        <form onSubmit={handleAdd} className="form-row">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input className="form-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" disabled={adding} className="btn btn-primary">
            {adding ? "Adding..." : "Send Invite"}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              {["Name", "Email", "Location", "Available", "Rating", "Tasks Done"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: 32 }}>No team members yet</td></tr>
            ) : members.map((m) => (
              <tr key={m.id}>
                <td style={{ color: "#f9fafb", fontWeight: 600 }}>{m.full_name || "—"}</td>
                <td>{m.users?.email || "—"}</td>
                <td>{[m.location_city, m.location_country].filter(Boolean).join(", ") || "—"}</td>
                <td>
                  <span className="badge" style={m.is_available ? { background: "#064e3b", color: "#34d399" } : { background: "#4a1515", color: "#f87171" }}>
                    {m.is_available ? "Yes" : "No"}
                  </span>
                </td>
                <td>{m.rating > 0 ? `${Number(m.rating).toFixed(1)}★` : "—"}</td>
                <td>{m.completed_tasks ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
