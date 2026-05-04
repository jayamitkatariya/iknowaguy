"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWorkers(); }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const { data } = await supabase.from("workers").select("*").order("created_at", { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  };

  const filtered = workers.filter((w) => !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <h1>Workers</h1>
        <p>Browse and manage registered workers</p>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <input className="input" placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "360px" }} />
      </div>

      {loading ? (
        <div className="grid-3">
          {[1,2,3].map((i) => <div key={i} className="card" style={{ height: "180px" }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔧</div>
          <h3>No workers found</h3>
          <p>Workers will appear here as they register</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((w) => (
            <div key={w.id} className="card" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "50%",
                  background: "var(--accent-light)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "18px", fontWeight: 700, color: "var(--accent)",
                }}>{w.name?.charAt(0)?.toUpperCase() || "?"}</div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700 }}>{w.name || "Anonymous"}</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{w.email}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px" }}>
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>{w.completed_tasks || 0}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tasks</p>
                </div>
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 700, color: "var(--accent)" }}>${w.total_earned || 0}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Earned</p>
                </div>
                <div>
                  <p style={{ fontSize: "20px", fontWeight: 700 }}>{w.rating || "—"}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Rating</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
