"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function BountyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [bounty, setBounty] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchBounty();
  }, [id]);

  const fetchBounty = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bounties")
      .select("*, category:category_id(name), assigned_human:assigned_human_id(full_name)")
      .eq("id", id)
      .single();

    setBounty(data || null);

    if (data) {
      const { data: subData } = await supabase
        .from("task_submissions")
        .select("*")
        .eq("bounty_id", id)
        .maybeSingle();
      setSubmission(subData || null);
    }

    setLoading(false);
  };

  const handleApprove = async () => {
    if (!submission) return;
    setUpdating(true);
    setMessage("");

    const { error: subError } = await supabase
      .from("task_submissions")
      .update({ status: "approved" })
      .eq("id", submission.id);

    if (subError) {
      setMessage("Error: " + subError.message);
      setUpdating(false);
      return;
    }

    const { error: bountyError } = await supabase
      .from("bounties")
      .update({ status: "completed" })
      .eq("id", id);

    if (bountyError) {
      setMessage("Error: " + bountyError.message);
    } else {
      setMessage("Submission approved and bounty marked completed.");
      fetchBounty();
    }

    setUpdating(false);
  };

  const handleReject = async () => {
    if (!submission) return;
    setUpdating(true);
    setMessage("");

    const { error } = await supabase
      .from("task_submissions")
      .update({ status: "rejected" })
      .eq("id", submission.id);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("Submission rejected.");
      fetchBounty();
    }

    setUpdating(false);
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

  if (loading) {
    return (
      <div style={{ color: "var(--text-secondary)", padding: "40px 0" }}>
        Loading bounty...
      </div>
    );
  }

  if (!bounty) {
    return (
      <div style={{ color: "var(--text-secondary)", padding: "40px 0" }}>
        Bounty not found.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <Link
          href="/bounties"
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            marginBottom: "12px",
            display: "inline-block",
          }}
        >
          ← Back to Bounties
        </Link>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginTop: "8px",
            marginBottom: "6px",
            letterSpacing: "-0.02em",
          }}
        >
          {bounty.title}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: 500,
              ...statusStyle(bounty.status),
            }}
          >
            {bounty.status.replace("_", " ")}
          </span>
          {bounty.category?.name && (
            <span
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              {bounty.category.name}
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        <div>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Details
            </h2>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Description
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6 }}>
                  {bounty.description}
                </div>
              </div>
              {bounty.instructions && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Instructions
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {bounty.instructions}
                  </div>
                </div>
              )}
            </div>
          </div>

          {submission && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
              }}
            >
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Submission
              </h2>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Status
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "3px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 500,
                    ...(submission.status === "approved"
                      ? { background: "var(--accent-light)", color: "var(--success)" }
                      : submission.status === "rejected"
                      ? { background: "#F8D7DA", color: "var(--error)" }
                      : { background: "#F3E8FF", color: "#7C3AED" }),
                  }}
                >
                  {submission.status}
                </span>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "4px" }}>
                  Content
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {submission.content || "No content provided."}
                </div>
              </div>
              {submission.media_urls && submission.media_urls.length > 0 && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "8px" }}>
                    Evidence
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {submission.media_urls.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "8px 12px",
                          background: "var(--bg-elevated)",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "13px",
                          color: "var(--accent)",
                          textDecoration: "none",
                          border: "1px solid var(--border)",
                        }}
                      >
                        File {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {submission.status === "submitted" && (
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <button
                    onClick={handleApprove}
                    disabled={updating}
                    style={{
                      padding: "10px 20px",
                      background: "var(--accent)",
                      color: "white",
                      border: "1px solid var(--accent)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: updating ? "not-allowed" : "pointer",
                      opacity: updating ? 0.7 : 1,
                      transition: "all 150ms ease",
                    }}
                  >
                    {updating ? "Updating..." : "Approve"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={updating}
                    style={{
                      padding: "10px 20px",
                      background: "var(--bg-elevated)",
                      color: "var(--error)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: updating ? "not-allowed" : "pointer",
                      opacity: updating ? 0.7 : 1,
                      transition: "all 150ms ease",
                    }}
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                color: "var(--text-primary)",
                marginBottom: "16px",
              }}
            >
              Info
            </h2>
            <div style={{ display: "grid", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "2px" }}>
                  Reward
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>
                  ${bounty.reward_amount}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "2px" }}>
                  Assigned
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                  {bounty.assigned_human?.full_name || "Unassigned"}
                </div>
              </div>
              {bounty.location_address && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "2px" }}>
                    Location
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {bounty.location_address}
                  </div>
                </div>
              )}
              {bounty.deadline && (
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "2px" }}>
                    Deadline
                  </div>
                  <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                    {new Date(bounty.deadline).toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)", marginBottom: "2px" }}>
                  Created
                </div>
                <div style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                  {new Date(bounty.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            padding: "12px 20px",
            borderRadius: "var(--radius-md)",
            fontSize: "14px",
            fontWeight: 500,
            background: message.startsWith("Error") ? "#F8D7DA" : "var(--accent-light)",
            color: message.startsWith("Error") ? "var(--error)" : "var(--accent)",
            boxShadow: "var(--shadow-md)",
            zIndex: 200,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
