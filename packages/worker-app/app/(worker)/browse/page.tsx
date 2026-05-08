"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BrowsePage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchBounties = async () => {
      setLoading(true);
      const { data } = await supabase.from("bounties").select("*, categories(name)").eq("status", "open").order("created_at", { ascending: false });
      if (!cancelled) {
        setBounties(data || []);
        setLoading(false);
      }
    };
    fetchBounties();
    supabase.from("categories").select("*").then(({ data }) => {
      if (!cancelled) setCategories(data || []);
    });
    return () => { cancelled = true; };
  }, []);

  const filtered = bounties.filter((b) => {
    const matchSearch = !search || b.title?.toLowerCase().includes(search.toLowerCase()) || b.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || b.categories?.name === category;
    return matchSearch && matchCat;
  });

  const categoryNames = ["all", ...categories.map((c) => c.name)];

  const getDeadline = (d: string | null) => {
    if (!d) return "No deadline";
    const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    return `${days}d left`;
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 className="oc-page-title">Browse Tasks</h1>
        <p className="oc-page-subtitle">Find open bounties and start earning</p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          className="oc-input"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: "320px", flex: 1 }}
        />
        <select
          className="oc-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ maxWidth: "200px", cursor: "pointer" }}
        >
          {categoryNames.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[1,2,3].map((i) => (
            <div key={i} className="oc-card" style={{ height: "180px", padding: "20px" }}>
              <div className="skeleton skeleton-title" style={{ width: "50%", marginBottom: "16px" }} />
              <div className="skeleton skeleton-text" style={{ width: "80%", marginBottom: "10px" }} />
              <div className="skeleton skeleton-text" style={{ width: "60%" }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="oc-empty-state">
          <div className="oc-empty-icon"></div>
          <h3 className="oc-empty-title">No tasks found</h3>
          <p className="oc-empty-sub">Check back later or adjust your filters</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {filtered.map((b) => (
            <Link key={b.id} href={`/browse/${b.id}`} style={{ textDecoration: "none" }}>
              <div className="oc-card" style={{
                padding: "24px",
                cursor: "pointer", height: "100%",
                display: "flex", flexDirection: "column"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>
                    ${b.reward || "—"}
                  </span>
                  <span className="oc-badge oc-badge-gray">
                    {getDeadline(b.deadline)}
                  </span>
                </div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--oc-text-strong)", marginBottom: "8px", lineHeight: 1.4, fontFamily: "var(--oc-font)", letterSpacing: "-0.01em" }}>{b.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--oc-text-muted)", lineHeight: 1.6, flex: 1, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", fontFamily: "var(--oc-font)" }}>
                  {b.description}
                </p>
                {b.categories?.name && (
                  <span className="oc-badge oc-badge-cyan" style={{ marginTop: "16px", alignSelf: "flex-start" }}>
                    {b.categories.name}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
