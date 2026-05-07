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
    const { data } = await supabase.from("human_profiles").select("*, users(email, role)").order("created_at", { ascending: false });
    setWorkers(data || []);
    setLoading(false);
  };

  const filtered = workers.filter((w: any) => !search || w.full_name?.toLowerCase().includes(search.toLowerCase()) || w.users?.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", marginBottom: 4 }}>Workers</h1>
        <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Browse and manage registered workers</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input className="oc-input" placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: "360px", fontFamily: "var(--oc-font)" }} />
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {[1,2,3].map((i) => <div key={i} className="oc-card" style={{ height: 180 }}><div className="skeleton skeleton-title" /><div className="skeleton skeleton-text" /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="oc-card">
          <div className="oc-empty-state">
            <div className="oc-empty-icon"></div>
            <div className="oc-empty-title">No workers found</div>
            <div className="oc-empty-sub">Workers will appear here as they register</div>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((w) => (
            <div key={w.id} className="oc-card">
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
                  display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "var(--oc-accent)",
                  fontFamily: "var(--oc-font)",
                }}>{w.full_name?.charAt(0)?.toUpperCase() || "?"}</div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{w.full_name || "Anonymous"}</h3>
                  <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{w.users?.email || "—"}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>{w.completed_tasks || 0}</p>
                  <p style={{ fontSize: 11, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Tasks</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--oc-accent)", fontFamily: "var(--oc-font)" }}>${w.hourly_rate || 0}</p>
                  <p style={{ fontSize: 11, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Earned</p>
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: "var(--oc-amber)", fontFamily: "var(--oc-font)" }}>{w.rating || "—"}</p>
                  <p style={{ fontSize: 11, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Rating</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
