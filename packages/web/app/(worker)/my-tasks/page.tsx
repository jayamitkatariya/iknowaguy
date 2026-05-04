"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("submissions")
      .select("*, bounties(*)")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    setTasks(data || []);
    setLoading(false);
  };

  const filtered = tasks.filter((t) => {
    if (tab === "all") return true;
    if (tab === "active")
      return t.status === "active" || t.status === "submitted";
    if (tab === "completed")
      return t.status === "completed" || t.status === "approved";
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      active: { background: "var(--accent-light)", color: "var(--accent)" },
      submitted: { background: "#FFF3CD", color: "#856404" },
      completed: { background: "var(--accent-light)", color: "var(--success)" },
      approved: { background: "var(--accent-light)", color: "var(--success)" },
      rejected: { background: "#F8D7DA", color: "var(--error)" },
    };
    return styles[status] || {
      background: "var(--bg-elevated)",
      color: "var(--text-secondary)",
    };
  };

  const tabs = ["active", "completed", "all"];

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
          My Tasks
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Track your active and completed work
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "4px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-sm)",
          width: "fit-content",
          marginBottom: "24px",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 16px",
              borderRadius: "calc(var(--radius-sm) - 2px)",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              background: tab === t ? "var(--bg-card)" : "transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-secondary)",
              boxShadow: tab === t ? "var(--shadow-sm)" : "none",
              transition: "all 150ms ease",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                height: "120px",
              }}
            >
              <div
                style={{
                  height: "20px",
                  width: "40%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "12px",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "60%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            No tasks found
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              maxWidth: "400px",
            }}
          >
            {tab === "active"
              ? "You have no active tasks. Browse open bounties to get started."
              : "No tasks in this category yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {filtered.map((task) => (
            <Link
              key={task.id}
              href={`/task/${task.bounty_id}`}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
                textDecoration: "none",
                color: "inherit",
                display: "block",
                transition: "box-shadow 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "var(--shadow-md)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                  "var(--shadow-sm)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {task.bounties?.title || "Untitled Task"}
                </h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 500,
                    flexShrink: 0,
                    marginLeft: "8px",
                    ...getStatusBadge(task.status),
                  }}
                >
                  {task.status}
                </span>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                {task.bounties?.description?.slice(0, 120)}
                {task.bounties?.description?.length > 120 ? "..." : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
