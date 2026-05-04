"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TeamPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("human_profiles")
      .select("*, users(email)")
      .order("full_name", { ascending: true });

    setMembers(data || []);
    setLoading(false);
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
          Team
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Human team members and workers
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
              minWidth: "500px",
            }}
          >
            <thead>
              <tr>
                {["Name", "Email", "Location", "Rating", "Tasks"].map(
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
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "var(--text-secondary)",
                    }}
                  >
                    No team members found
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id}>
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
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.full_name}
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
                          {m.full_name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                      )}
                      {m.full_name}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {m.users?.email || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-secondary)",
                        fontSize: "13px",
                      }}
                    >
                      {m.location_city && m.location_country
                        ? `${m.location_city}, ${m.location_country}`
                        : m.location_city || m.location_country || "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {m.rating > 0 ? m.rating.toFixed(2) : "—"}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                        fontWeight: 500,
                      }}
                    >
                      {m.completed_tasks || 0}
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
