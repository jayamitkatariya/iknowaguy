"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("human_profiles")
      .select("*, users(email)")
      .order("created_at", { ascending: false });

    setWorkers(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    const { error } = await supabase
      .from("human_profiles")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error(error);
    } else {
      setWorkers((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status } : w))
      );
    }
    setUpdating(null);
  };

  const statusBadge = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      verified: { background: "var(--accent-light)", color: "var(--success)" },
      pending: { background: "#FFF3CD", color: "#856404" },
      suspended: { background: "#F8D7DA", color: "var(--error)" },
    };
    return map[status] || map.pending;
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          Workers
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Manage human worker verification and status
        </p>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "14px",
              minWidth: "600px",
            }}
          >
            <thead>
              <tr>
                {["Name", "Email", "Location", "Rating", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "var(--text-secondary)",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-elevated)",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : workers.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No workers found
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id}>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {w.avatar_url ? (
                        <img
                          src={w.avatar_url}
                          alt={w.full_name}
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "var(--accent-light)",
                            color: "var(--accent)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {w.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      {w.full_name}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {w.users?.email || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {w.location_city && w.location_country
                        ? `${w.location_city}, ${w.location_country}`
                        : w.location_city || w.location_country || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {w.rating > 0 ? w.rating.toFixed(2) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 500,
                          ...statusBadge(w.status || "pending"),
                        }}
                      >
                        {w.status || "pending"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ display: "flex", gap: "8px" }}>
                        {w.status !== "verified" && (
                          <button
                            onClick={() => updateStatus(w.id, "verified")}
                            disabled={updating === w.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "12px",
                              fontWeight: 500,
                              border: "1px solid var(--accent)",
                              background: "var(--accent)",
                              color: "white",
                              cursor: "pointer",
                              opacity: updating === w.id ? 0.6 : 1,
                              transition: "all 150ms ease",
                            }}
                          >
                            Verify
                          </button>
                        )}
                        {w.status !== "suspended" && (
                          <button
                            onClick={() => updateStatus(w.id, "suspended")}
                            disabled={updating === w.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "12px",
                              fontWeight: 500,
                              border: "1px solid var(--error)",
                              background: "transparent",
                              color: "var(--error)",
                              cursor: "pointer",
                              opacity: updating === w.id ? 0.6 : 1,
                              transition: "all 150ms ease",
                            }}
                          >
                            Suspend
                          </button>
                        )}
                        {w.status === "suspended" && (
                          <button
                            onClick={() => updateStatus(w.id, "pending")}
                            disabled={updating === w.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "12px",
                              fontWeight: 500,
                              border: "1px solid var(--border)",
                              background: "var(--bg-elevated)",
                              color: "var(--text-secondary)",
                              cursor: "pointer",
                              opacity: updating === w.id ? 0.6 : 1,
                              transition: "all 150ms ease",
                            }}
                          >
                            Reactivate
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
    </div>
  );
}
