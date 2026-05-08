"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? match.split("=")[1] : null;
}

export default function BountiesPage() {
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "pending">("all");
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBounties = async () => {
      const apiKey = getCookie("hah_api_key");
      const tenantId = getCookie("hah_tenant_id");

      if (!apiKey || !tenantId) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

      try {
        const res = await fetch(`${apiUrl}/api/bounties?limit=50`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Tenant-ID": tenantId,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch bounties");
        const result = await res.json();
        setBounties(result.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBounties();
  }, []);

  const filteredBounties = filter === "all"
    ? bounties
    : filter === "active"
    ? bounties.filter((b) => b.status === "open" || b.status === "in_progress")
    : filter === "pending"
    ? bounties.filter((b) => b.status === "pending" || b.status === "submitted" || b.status === "reviewing")
    : bounties.filter((b) => b.status === "completed" || b.status === "approved" || b.status === "rejected");

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
        <header style={{ marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>Bounties</h1>
          <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
        </header>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
            Bounties
          </h1>
          <p style={{ color: "var(--oc-text-muted)" }}>
            Manage your posted bounties for human workers
          </p>
        </div>
        <Link href="/bounties/new" className="oc-btn oc-btn-primary">
          + Create New Bounty
        </Link>
      </header>

      {error && (
        <div style={{ padding: "1rem", marginBottom: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", color: "var(--oc-red)" }}>
          {error}
        </div>
      )}

      {/* Filters */}
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

      {/* Bounties List */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {filteredBounties.map((bounty) => (
          <div key={bounty.id} className="oc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <Link href={`/bounties/${bounty.id}`} style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {bounty.title}
                </Link>
                <span className={`oc-badge ${bounty.status === "open" || bounty.status === "in_progress" ? "oc-badge-green" : bounty.status === "completed" || bounty.status === "approved" ? "oc-badge-green" : "oc-badge-amber"}`} style={{ textTransform: "capitalize" }}>
                  {bounty.status?.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ color: "var(--oc-text-muted)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                {bounty.description?.slice(0, 100)}{bounty.description?.length > 100 ? "..." : ""}
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
                {bounty.assigned_human_id ? "1 worker" : "No workers"}
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredBounties.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--oc-text-muted)" }}>
          <p>No bounties found with this filter.</p>
          <Link href="/bounties/new" className="oc-btn oc-btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Create your first bounty
          </Link>
        </div>
      )}
    </div>
  );
}
