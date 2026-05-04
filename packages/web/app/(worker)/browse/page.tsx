"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BrowsePage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bounties")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    setBounties(data || []);
    setLoading(false);
  };

  const filtered = bounties.filter((b) => {
    const matchesSearch =
      !search ||
      b.title?.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || b.category === category;
    return matchesSearch && matchesCategory;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "highest") return (b.reward || 0) - (a.reward || 0);
    return (
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  const categories = [
    "all",
    ...Array.from(new Set(bounties.map((b) => b.category).filter(Boolean))),
  ];

  const getDeadline = (deadline: string | null) => {
    if (!deadline) return "No deadline";
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    return `${days} day${days !== 1 ? "s" : ""} left`;
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
          Browse Tasks
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Find open bounties and start earning
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
            color: "var(--text-primary)",
            outline: "none",
          }}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
            color: "var(--text-primary)",
            minWidth: "150px",
            outline: "none",
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{
            padding: "10px 14px",
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "14px",
            color: "var(--text-primary)",
            minWidth: "150px",
            outline: "none",
          }}
        >
          <option value="newest">Newest</option>
          <option value="highest">Highest Reward</option>
        </select>
      </div>

      {loading ? (
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                height: "200px",
              }}
            >
              <div
                style={{
                  height: "20px",
                  width: "60%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "12px",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "100%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "8px",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "80%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {sorted.map((bounty) => (
            <Link
              key={bounty.id}
              href={`/task/${bounty.id}`}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                boxShadow: "var(--shadow-sm)",
                transition: "box-shadow 150ms ease",
                textDecoration: "none",
                color: "inherit",
                display: "block",
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
                  marginBottom: "12px",
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
                  {bounty.title}
                </h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 500,
                    background: "var(--accent-light)",
                    color: "var(--accent)",
                    flexShrink: 0,
                    marginLeft: "8px",
                  }}
                >
                  {bounty.category}
                </span>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {bounty.description}
              </p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "var(--accent)",
                  }}
                >
                  ${bounty.reward}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {getDeadline(bounty.deadline)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
