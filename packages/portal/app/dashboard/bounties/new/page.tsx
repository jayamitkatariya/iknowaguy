"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";

const CATEGORIES = [
  "Data Entry", "Web Research", "Content Writing", "Image Annotation",
  "Video Annotation", "Audio Transcription", "Translation", "Coding",
  "Testing/Q&A", "Survey", "Other"
];

export default function NewBountyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    reward_amount: "",
    currency: "usd",
    category: "",
    max_assignments: "1",
    deadline: "",
    visibility: "public",
  });
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const getOrg = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await supabase.from("users").select("org_id").eq("id", session.user.id).single();
      setOrgId(res.data?.org_id || null);
    };
    getOrg();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Not authenticated"); setLoading(false); return; }

      if (!orgId) { setError("No organization found"); setLoading(false); return; }

      const payload = {
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        reward_amount: parseFloat(form.reward_amount),
        currency: form.currency,
        category: form.category,
        max_assignments: parseInt(form.max_assignments),
        deadline: form.deadline || null,
        visibility: form.visibility,
        org_id: orgId,
        status: "open",
      };

      const res = await apiFetch("/bounties", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.data?.id) {
        router.push("/dashboard/bounties");
      } else {
                const errMsg = res.error && typeof res.error === 'object' && 'message' in res.error
          ? (res.error as any).message
          : typeof res.error === 'string' ? res.error : "Failed to create bounty";
        setError(errMsg);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div>
      <Link href="/dashboard/bounties" style={{
        display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24,
        fontSize: 12, color: "var(--oc-text-muted)", textDecoration: "none", fontFamily: "var(--oc-font)",
      }}>
        ← Back to Bounties
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em", marginBottom: 8 }}>Create New Bounty</h1>
        <p style={{ fontSize: 14, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Define a task and set a reward to attract workers</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: "720px" }}>
        <div className="oc-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--oc-font)" }}>Task Details</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annotate 100 images for object detection"
              required
              className="oc-input"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Description *
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what workers need to do..."
              required
              rows={4}
              className="oc-input"
              style={{ minHeight: 100, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Instructions
            </label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Step-by-step instructions for workers (optional)"
              rows={3}
              className="oc-input"
              style={{ minHeight: 80, resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
              Category *
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
              className="oc-input"
              style={{ width: "100%" }}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="oc-card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: "var(--oc-text-muted)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--oc-font)" }}>Reward & Settings</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
                Reward Amount *
              </label>
              <input
                type="number"
                value={form.reward_amount}
                onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
                placeholder="25.00"
                required
                min="0.01"
                step="0.01"
                className="oc-input"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
                Currency
              </label>
              <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="oc-input">
                <option value="usd">USD</option>
                <option value="eur">EUR</option>
                <option value="gbp">GBP</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
                Max Assignments
              </label>
              <input
                type="number"
                value={form.max_assignments}
                onChange={(e) => setForm({ ...form, max_assignments: e.target.value })}
                min="1"
                max="100"
                className="oc-input"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
                Deadline
              </label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="oc-input"
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>
                Visibility
              </label>
              <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="oc-input">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 24 }}>
            <p style={{ color: "#ef4444", fontSize: 13, fontFamily: "var(--oc-font)" }}>{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 12 }}>
          <button type="submit" disabled={loading} className="oc-btn oc-btn-primary" style={{ padding: "12px 32px" }}>
            {loading ? "Creating..." : "Create Bounty"}
          </button>
          <Link href="/dashboard/bounties" className="oc-btn oc-btn-ghost" style={{ padding: "12px 24px" }}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
