"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBounties(); }, []);

  const fetchBounties = async () => {
    setLoading(true);
    const { data } = await supabase.from("bounties").select("*").order("created_at", { ascending: false });
    setBounties(data || []);
    setLoading(false);
  };

  const filtered = bounties.filter((b) => {
    const matchStatus = status === "all" || b.status === status;
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1>Bounties</h1>
          <p>Manage all your bounties</p>
        </div>
        <Link href="/bounties/new" className="btn btn-primary">+ Create Bounty</Link>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input className="input" placeholder="Search bounties..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "320px" }} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: "180px" }}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ height: "300px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🎯</div>
          <h3>No bounties found</h3>
          <p>Create a bounty or adjust your filters</p>
        </div>
      ) : (
        <div className="card-flat" style={{ overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Status</th><th>Reward</th><th>Deadline</th><th>Created</th></tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/bounties/${b.id}`} style={{ fontWeight: 600, color: "var(--text-primary)" }}>{b.title}</Link></td>
                  <td><span className={`badge ${b.status === "open" ? "badge-success" : b.status === "completed" ? "badge-neutral" : "badge-warning"}`}>{b.status?.replace("_", " ")}</span></td>
                  <td style={{ fontWeight: 700, color: "var(--accent)" }}>${b.reward || 0}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{b.deadline ? new Date(b.deadline).toLocaleDateString() : "—"}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
