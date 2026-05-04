"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BrowsePage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchBounties(); }, []);

  const fetchBounties = async () => {
    setLoading(true);
    const { data } = await supabase.from("bounties").select("*").eq("status", "open").order("created_at", { ascending: false });
    setBounties(data || []);
    setLoading(false);
  };

  const filtered = bounties.filter((b) => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || b.category === category;
    return matchSearch && matchCat;
  });

  const categories = ["all", ...Array.from(new Set(bounties.map((b) => b.category).filter(Boolean)))];

  const getDeadline = (d: string | null) => {
    if (!d) return "No deadline";
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    return `${days}d left`;
  };

  return (
    <div>
      <div className="page-header">
        <h1>Browse Tasks</h1>
        <p>Find open bounties and start earning</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input className="input" placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "320px" }} />
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)} style={{ maxWidth: "200px" }}>
          {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid-3">
          {[1,2,3].map((i) => <div key={i} className="card" style={{ height: "200px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /><div className="skeleton skeleton-text" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📭</div>
          <h3>No tasks found</h3>
          <p>Check back later or adjust your filters</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/browse/${b.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card" style={{ padding: "28px", cursor: "pointer", height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                  <span className="badge badge-success" style={{ fontSize: "16px", fontWeight: 700 }}>${b.reward || "—"}</span>
                  <span className="badge badge-neutral">{getDeadline(b.deadline)}</span>
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "8px", lineHeight: 1.3 }}>{b.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                  {b.description}
                </p>
                {b.category && <span className="badge badge-neutral" style={{ marginTop: "16px", alignSelf: "flex-start" }}>{b.category}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
