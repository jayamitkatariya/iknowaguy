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
    const { data } = await supabase.from("bounties").select("*, categories(name)").order("created_at", { ascending: false });
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ marginBottom: 0 }}>
          <h1 className="oc-page-title">Bounties</h1>
          <p className="oc-page-subtitle">Manage all your bounties</p>
        </div>
        <Link href="/bounties/new" className="oc-btn oc-btn-primary">+ Create Bounty</Link>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input className="oc-input" placeholder="Search bounties..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "320px", fontFamily: "var(--oc-font)" }} />
        <select className="oc-input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: "180px", fontFamily: "var(--oc-font)" }}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="oc-card" style={{ height: "300px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>
      ) : filtered.length === 0 ? (
        <div className="oc-card">
          <div className="oc-empty-state">
            <div className="oc-empty-icon"></div>
            <div className="oc-empty-title">No bounties found</div>
            <div className="oc-empty-sub">Create a bounty or adjust your filters</div>
          </div>
        </div>
      ) : (
        <div className="oc-card" style={{ padding: "0", overflow: "hidden" }}>
          <table className="oc-table" style={{ fontFamily: "var(--oc-font)" }}>
            <thead>
              <tr><th style={{ fontFamily: "var(--oc-font)" }}>Title</th><th style={{ fontFamily: "var(--oc-font)" }}>Status</th><th style={{ fontFamily: "var(--oc-font)" }}>Reward</th><th style={{ fontFamily: "var(--oc-font)" }}>Deadline</th><th style={{ fontFamily: "var(--oc-font)" }}>Created</th></tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td><Link href={`/bounties/${b.id}`} style={{ fontWeight: 600, color: "var(--oc-text)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>{b.title}</Link></td>
                  <td>
                    <span className={`oc-badge ${b.status === "open" ? "oc-badge-green" : b.status === "completed" ? "oc-badge-gray" : "oc-badge-amber"}`}>{b.status?.replace("_", " ")}</span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${b.reward_amount || 0}</td>
                  <td style={{ color: "var(--oc-text-muted)", fontSize: 12, fontFamily: "var(--oc-font)" }}>{b.deadline ? new Date(b.deadline).toLocaleDateString() : "—"}</td>
                  <td style={{ color: "var(--oc-text-muted)", fontSize: 12, fontFamily: "var(--oc-font)" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
