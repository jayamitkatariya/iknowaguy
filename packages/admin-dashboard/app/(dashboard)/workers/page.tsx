"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

interface Worker {
  id: string;
  full_name: string;
  avatar_url: string | null;
  location_city: string | null;
  location_country: string | null;
  skills: string[];
  rating: number;
  completed_tasks: number;
  verification_status: string;
  users: { email: string } | null;
}

function verificationBadgeClass(status: string) {
  const map: Record<string, string> = {
    verified: "badge-green",
    pending: "badge-amber",
    rejected: "badge-red",
    suspended: "badge-red",
  };
  return map[status] || "badge-gray";
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      const { data, error } = await supabase
        .from("human_profiles")
        .select("*, users:user_id(email)")
        .order("created_at", { ascending: false });
      if (error) {
        setToast({ type: "error", message: error.message });
      }
      setWorkers((data as Worker[]) || []);
      setLoading(false);
    }
    fetchWorkers();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return workers;
    const q = search.trim().toLowerCase();
    return workers.filter((w) =>
      (w.full_name || "").toLowerCase().includes(q) ||
      (w.users?.email || "").toLowerCase().includes(q)
    );
  }, [workers, search]);

  const handleVerify = async (id: string) => {
    setUpdating(id + "-verify");
    const { error } = await supabase
      .from("human_profiles")
      .update({ verification_status: "verified" })
      .eq("id", id);
    if (error) {
      setToast({ type: "error", message: error.message });
    } else {
      setWorkers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, verification_status: "verified" } : w))
      );
      setToast({ type: "success", message: "Worker verified" });
    }
    setUpdating(null);
    setTimeout(() => setToast(null), 3000);
  };

  const handleSuspend = async (id: string) => {
    setUpdating(id + "-suspend");
    // Note: schema check constraint allows 'pending', 'verified', 'rejected'.
    // Using 'rejected' as the closest semantic match for suspend.
    const { error } = await supabase
      .from("human_profiles")
      .update({ verification_status: "rejected" })
      .eq("id", id);
    if (error) {
      setToast({ type: "error", message: error.message });
    } else {
      setWorkers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, verification_status: "rejected" } : w))
      );
      setToast({ type: "success", message: "Worker suspended" });
    }
    setUpdating(null);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="page-container">
      <style>{`
        .workers-search { max-width: 320px; flex: 1 }
        .workers-actions { display: flex; gap: 8px }
        .workers-actions button { padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s ease }
        .workers-actions .btn-verify { background: #064e3b; color: #34d399 }
        .workers-actions .btn-verify:hover { background: #065f46 }
        .workers-actions .btn-verify:disabled { opacity: 0.5; cursor: not-allowed }
        .workers-actions .btn-suspend { background: #4a1515; color: #f87171 }
        .workers-actions .btn-suspend:hover { background: #7f1d1d }
        .workers-actions .btn-suspend:disabled { opacity: 0.5; cursor: not-allowed }
        .skill-tag { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 600; background: #1f2937; color: #d1d5db; border: 1px solid #374151; margin: 2px }
        @media (max-width: 768px) {
          .workers-search { max-width: 100% }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast-container" style={{ top: 80 }}>
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✓" : "⚠"} {toast.message}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Workers</h1>
          <p className="page-subtitle">{filtered.length} worker{filtered.length !== 1 ? "s" : ""} total</p>
        </div>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="input workers-search"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              {["Name", "Email", "Location", "Skills", "Rating", "Tasks Done", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: 40 }}>
                  <div className="loading-state">
                    <div className="loading-state-icon">⏳</div>
                    <div>Loading workers...</div>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <div className="empty-state-title">No workers found</div>
                    <div className="empty-state-sub">Try adjusting your search.</div>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {w.avatar_url ? (
                        <img src={w.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                          {(w.full_name || "?").slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span style={{ fontWeight: 600, color: "#f9fafb" }}>{w.full_name || "—"}</span>
                    </div>
                  </td>
                  <td>{w.users?.email || "—"}</td>
                  <td>{[w.location_city, w.location_country].filter(Boolean).join(", ") || "—"}</td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", maxWidth: 200 }}>
                      {(w.skills || []).length === 0 ? (
                        <span style={{ color: "#6b7280", fontSize: 13 }}>—</span>
                      ) : (
                        w.skills.map((s) => (
                          <span key={s} className="skill-tag">{s}</span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ color: "#fbbf24", fontWeight: 700 }}>
                    {w.rating > 0 ? `${Number(w.rating).toFixed(1)}★` : "—"}
                  </td>
                  <td>{w.completed_tasks ?? 0}</td>
                  <td>
                    <span className={`badge ${verificationBadgeClass(w.verification_status)}`}>
                      {w.verification_status}
                    </span>
                  </td>
                  <td>
                    <div className="workers-actions">
                      {w.verification_status !== "verified" && (
                        <button
                          className="btn-verify"
                          onClick={() => handleVerify(w.id)}
                          disabled={updating === w.id + "-verify"}
                        >
                          {updating === w.id + "-verify" ? "..." : "Verify"}
                        </button>
                      )}
                      {w.verification_status !== "rejected" && w.verification_status !== "suspended" && (
                        <button
                          className="btn-suspend"
                          onClick={() => handleSuspend(w.id)}
                          disabled={updating === w.id + "-suspend"}
                        >
                          {updating === w.id + "-suspend" ? "..." : "Suspend"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
