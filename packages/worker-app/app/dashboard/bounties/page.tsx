"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function BountiesPage() {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "pending">("all");
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchBounties = async () => {
      try {
        const { data, error: bErr } = await supabase
          .from("bounties")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (bErr) throw new Error(bErr.message);
        if (!cancelled) setBounties(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchBounties();
    return () => { cancelled = true; };
  }, []);

  const filteredBounties = filter === "all"
    ? bounties
    : filter === "active"
    ? bounties.filter((b) => b.status === "open" || b.status === "in_progress" || b.status === "accepted")
    : filter === "pending"
    ? bounties.filter((b) => b.status === "submitted" || b.status === "reviewing")
    : bounties.filter((b) => b.status === "completed");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Bounties</h1>
        <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Bounties</h1>
          <p style={{ color: "var(--oc-text-muted)" }}>Manage your posted bounties for human workers</p>
        </div>
        <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary">
          + Create New Bounty
        </Link>
      </header>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", color: "var(--oc-red)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {(["all", "active", "pending", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`oc-btn ${filter === f ? "oc-btn-primary" : "oc-btn-ghost"}`}
            style={{ textTransform: "capitalize" }}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredBounties.map((bounty) => (
          <div key={bounty.id} className="oc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <Link href={`/dashboard/bounties/${bounty.id}`} style={{ fontSize: "1.125rem", fontWeight: 600, textDecoration: "none" }}>
                  {bounty.title}
                </Link>
                <span className={`oc-badge ${bounty.status === "open" || bounty.status === "in_progress" ? "oc-badge-green" : bounty.status === "completed" ? "oc-badge-green" : "oc-badge-amber"}`} style={{ textTransform: "capitalize" }}>
                  {bounty.status?.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ color: "var(--oc-text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {bounty.description?.slice(0, 100)}{(bounty.description?.length || 0) > 100 ? "..." : ""}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--oc-text-muted)" }}>
                Created {formatDate(bounty.created_at)}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.25rem" }}>
                ${bounty.reward_amount || 0}
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--oc-text-muted)" }}>
                {bounty.assigned_human_id ? "Assigned" : "Open"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--oc-text-muted)" }}>
          <p>No bounties found with this filter.</p>
          <Link href="/dashboard/bounties/new" className="oc-btn oc-btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Create your first bounty
          </Link>
        </div>
      )}
    </div>
  );
}
