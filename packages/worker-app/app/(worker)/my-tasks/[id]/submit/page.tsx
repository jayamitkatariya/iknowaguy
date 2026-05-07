"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function TaskSubmitPage() {
  const { id } = useParams();
  const router = useRouter();
  const [bounty, setBounty] = useState<any>(null);
  const [content, setContent] = useState("");
  const [mediaUrls, setMediaUrls] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetchData(); }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const { data: b } = await supabase.from("bounties").select("*").eq("id", id).single();
    if (b) {
      setBounty(b);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("You must be logged in."); setSubmitting(false); return; }
    const urls = mediaUrls.split(",").map((u) => u.trim()).filter(Boolean);
    const { error: insertError } = await supabase.from("task_submissions").insert({
      bounty_id: id,
      human_id: user.id,
      content,
      media_urls: urls,
      status: "submitted",
    });
    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }
    await supabase.from("bounties").update({ status: "submitted" }).eq("id", id);
    router.push("/my-tasks");
  };

  if (loading) return (
    <div style={{ padding: "40px 0" }}>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-text" />
    </div>
  );

  if (!bounty) return (
    <div className="oc-empty-state">
      <div className="oc-empty-icon"></div>
      <div className="oc-empty-title">Task not found</div>
      <Link href="/my-tasks" className="oc-btn oc-btn-ghost" style={{ marginTop: 16 }}>Back to My Tasks</Link>
    </div>
  );

  return (
    <div>
      <Link href="/my-tasks" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24, fontSize: 12, color: "var(--oc-text-muted)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>
        ← Back to My Tasks
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em", marginBottom: 8 }}>Submit Task</h1>
        {bounty && <p style={{ fontSize: 14, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>{bounty.title}</p>}
      </div>

      <div className="oc-card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Submission Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe what you did, provide your answer or deliverable..."
              required
              style={{
                width: "100%", minHeight: 140, padding: "12px 16px",
                background: "var(--oc-bg-tertiary)", border: "1px solid var(--oc-border)",
                borderRadius: 8, color: "var(--oc-text)",
                fontSize: 14, fontFamily: "var(--oc-font)",
                resize: "vertical", outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Media URLs
            </label>
            <input
              type="text"
              value={mediaUrls}
              onChange={(e) => setMediaUrls(e.target.value)}
              placeholder="https://example.com/file1.jpg, https://example.com/file2.png"
              style={{
                width: "100%", padding: "12px 16px",
                background: "var(--oc-bg-tertiary)", border: "1px solid var(--oc-border)",
                borderRadius: 8, color: "var(--oc-text)",
                fontSize: 14, fontFamily: "var(--oc-font)",
                outline: "none", boxSizing: "border-box",
              }}
            />
            <p style={{ fontSize: 11, color: "var(--oc-text-muted)", marginTop: 6, fontFamily: "var(--oc-font)" }}>Comma-separated URLs for screenshots, files, or evidence</p>
          </div>

          {error && <p style={{ color: "var(--oc-red)", fontSize: 13, marginBottom: 16, fontFamily: "var(--oc-font)" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="oc-btn oc-btn-primary"
            style={{ fontSize: 14, padding: "12px 32px" }}
          >
            {submitting ? "Submitting..." : "Submit Task"}
          </button>
        </form>
      </div>
    </div>
  );
}