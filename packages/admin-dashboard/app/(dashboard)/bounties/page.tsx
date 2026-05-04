"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Bounty {
  id: string;
  title: string;
  category_id: string | null;
  status: string;
  reward_amount: number;
  currency: string;
  created_at: string;
  assigned_human: { full_name: string } | null;
}

const STATUS_OPTIONS = ["", "open", "assigned", "submitted", "completed", "disputed", "cancelled"];

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    open: "badge-green",
    assigned: "badge-blue",
    submitted: "badge-amber",
    completed: "badge-blue",
    paid: "badge-green",
    disputed: "badge-red",
    cancelled: "badge-gray",
  };
  return map[status] || "badge-gray";
}

function formatCurrency(amount: number, currency?: string) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export default function AdminBountiesPage() {
  const router = useRouter();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchBounties() {
      setLoading(true);
      let query = supabase
        .from("bounties")
        .select("*, assigned_human:human_profiles!bounties_assigned_human_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (status) query = query.eq("status", status);
      const { data } = await query;
      setBounties(data || []);
      setLoading(false);
    }
    fetchBounties();
  }, [status]);

  const filtered = useMemo(() => {
    if (!search.trim()) return bounties;
    const q = search.trim().toLowerCase();
    return bounties.filter((b) => b.title.toLowerCase().includes(q));
  }, [bounties, search]);

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Bounties</h1>
          <p className="page-subtitle">{filtered.length} bounty{filtered.length !== 1 ? "ies" : "y"} total</p>
        </div>
        <Link href="/bounties/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Bounty
        </Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="input"
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <select
          className="input select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.filter((s) => s).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {["Title", "Category", "Status", "Reward", "Assigned To", "Created"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                  <div className="loading-state">
                    <div className="loading-state-icon">⏳</div>
                    <div>Loading bounties...</div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No bounties found</div>
                    <div className="empty-state-sub">Try adjusting your filters or create a new bounty.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => router.push(`/bounties/${b.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td style={{ fontWeight: 600, color: "#f9fafb" }}>{b.title}</td>
                  <td>{b.category_id || "—"}</td>
                  <td><span className={`badge ${statusBadgeClass(b.status)}`}>{b.status}</span></td>
                  <td style={{ color: "#818cf8", fontWeight: 700 }}>{formatCurrency(b.reward_amount, b.currency)}</td>
                  <td>{b.assigned_human?.full_name || "—"}</td>
                  <td style={{ fontSize: 12, color: "#6b7280" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
