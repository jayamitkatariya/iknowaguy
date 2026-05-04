"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const statusOptions = [
  "all",
  "open",
  "accepted",
  "in_progress",
  "submitted",
  "reviewing",
  "completed",
  "disputed",
  "cancelled",
];

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchBounties();
  }, [statusFilter]);

  const fetchBounties = async () => {
    setLoading(true);
    let query = supabase
      .from("bounties")
      .select("*, assigned_human:assigned_human_id(full_name)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
    }
    setBounties(data || []);
    setLoading(false);
  };

  const statusStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      open: { background: "var(--accent-light)", color: "var(--accent)" },
      accepted: { background: "#E0F2FE", color: "#0369A1" },
      in_progress: { background: "#FFF3CD", color: "#856404" },
      submitted: { background: "#F3E8FF", color: "#7C3AED" },
      reviewing: { background: "#FFEDD5", color: "#C2410C" },
      completed: { background: "var(--accent-light)", color: "var(--success)" },
      disputed: { background: "#F8D7DA", color: "var(--error)" },
      cancelled: { background: "var(--bg-elevated)", color: "var(--text-secondary)" },
    };
    return map[status] || map.cancelled;
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}
          >
            Bounties
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
            Manage and track all bounties
          </p>
        </div>
        <Link
          href="/bounties/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "var(--accent)",
            color: "white",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 150ms ease",
          }}
        >
          + New Bounty
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 500,
              border: "1px solid",
              cursor: "pointer",
              transition: "all 150ms ease",
              ...(statusFilter === s
                ? {
                    background: "var(--accent)",
                    color: "white",
                    borderColor: "var(--accent)",
                  }
                : {
                    background: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    borderColor: "var(--border)",
                  }),
            }}
          >
            {s === "all" ? "All" : s.replace("_", " ")}
          </button>
        ))}
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
                {["Title", "Status", "Reward", "Assigned", "Created"].map(
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
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Loading...
                  </td>
                </tr>
              ) : bounties.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No bounties found
                  </td>
                </tr>
              ) : (
                bounties.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => router.push(`/bounties/${b.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {b.title}
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
                          ...statusStyle(b.status),
                        }}
                      >
                        {b.status.replace("_", " ")}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      ${b.reward_amount}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {b.assigned_human?.full_name || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {new Date(b.created_at).toLocaleDateString()}
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
