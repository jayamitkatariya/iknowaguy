"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

interface Bounty {
  id: string;
  title: string;
  reward_amount: number;
  status: string;
  created_at: string;
  category?: string;
  description?: string;
}

export default function BountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchBounties(); }, [filter]);

  const fetchBounties = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const orgRes = await supabase
        .from("users")
        .select("org_id")
        .eq("id", session.user.id)
        .single();

      const orgId = orgRes.data?.org_id;
      if (!orgId) { setLoading(false); return; }

      let url = `/bounties?org_id=${orgId}&limit=50`;
      if (filter !== "all") url += `&status=${filter}`;

      const res = await apiFetch(url);
      setBounties(res.data || []);
    } catch (err) {
      console.error("Error fetching bounties:", err);
    }

    setLoading(false);
  };

  const filteredBounties = bounties.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    all: bounties.length,
    open: bounties.filter((b) => b.status === "open").length,
    in_progress: bounties.filter((b) => b.status === "in_progress").length,
    submitted: bounties.filter((b) => b.status === "submitted").length,
    completed: bounties.filter((b) => b.status === "completed").length,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--oc-text)", marginBottom: "6px", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Bounties</h1>
          <p style={{ fontSize: "14px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Manage your task bounties</p>
        </div>
        <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary">
          + New Bounty
        </Link>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        {(["all", "open", "in_progress", "submitted", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid",
              borderColor: filter === f ? "var(--oc-accent)" : "var(--oc-border)",
              background: filter === f ? "rgba(245, 158, 11, 0.1)" : "transparent",
              color: filter === f ? "var(--oc-accent)" : "var(--oc-text-muted)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "var(--oc-font)",
              textTransform: "capitalize",
            }}
          >
            {f.replace("_", " ")} ({statusCounts[f]})
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search bounties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="oc-input"
          style={{ maxWidth: "320px" }}
        />
      </div>

      {loading ? (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "40px", textAlign: "center" }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
      ) : filteredBounties.length === 0 ? (
        <div style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "8px", padding: "64px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.3, fontFamily: "var(--oc-font)" }}>◎</div>
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--oc-text)", marginBottom: "8px", fontFamily: "var(--oc-font)" }}>No bounties found</h3>
          <p style={{ fontSize: "13px", color: "var(--oc-text-muted)", marginBottom: "20px", fontFamily: "var(--oc-font)" }}>
            {search ? "Try adjusting your search" : "Create your first bounty to get started"}
          </p>
          {!search && (
            <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary">
              Create Bounty
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {filteredBounties.map((bounty) => (
            <div key={bounty.id} className="oc-card" style={{ cursor: "pointer" }}
              onClick={() => window.location.href = `/dashboard/bounties/${bounty.id}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>
                      {bounty.title}
                    </h3>
                    <span style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "3px 10px", borderRadius: "4px",
                      background: bounty.status === "open" ? "rgba(22,163,74,0.1)" :
                        bounty.status === "in_progress" ? "rgba(245, 158, 11, 0.1)" :
                          bounty.status === "submitted" ? "rgba(59, 130, 246, 0.1)" : "rgba(22,163,74,0.1)",
                      color: bounty.status === "open" || bounty.status === "completed" ? "#16a34a" :
                        bounty.status === "in_progress" ? "var(--oc-amber)" : "#3b82f6",
                      border: `1px solid ${bounty.status === "open" ? "rgba(22,163,74,0.3)" :
                        bounty.status === "in_progress" ? "rgba(245, 158, 11, 0.3)" :
                          bounty.status === "submitted" ? "rgba(59, 130, 246, 0.3)" : "rgba(22,163,74,0.3)"}`,
                      fontFamily: "var(--oc-font)",
                      textTransform: "capitalize",
                    }}>
                      {bounty.status.replace("_", " ")}
                    </span>
                  </div>
                  {bounty.description && (
                    <p style={{ fontSize: "13px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)", lineHeight: 1.5, marginBottom: "12px" }}>
                      {bounty.description.slice(0, 120)}{bounty.description.length > 120 ? "..." : ""}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
                    <span>Reward: <strong style={{ color: "var(--oc-accent)" }}>${bounty.reward_amount}</strong></span>
                    <span>Created: {new Date(bounty.created_at).toLocaleDateString()}</span>
                    {bounty.category && <span>Category: {bounty.category}</span>}
                  </div>
                </div>
                <div style={{ fontSize: "20px", opacity: 0.3 }}>→</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
