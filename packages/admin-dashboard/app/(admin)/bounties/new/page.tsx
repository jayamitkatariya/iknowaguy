"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function CreateBountyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", category_id: "", reward_amount: "", deadline: "", instructions: "" });
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("categories").select("*").order("name").then(({ data }) => setCategories(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.from("bounties").insert({
      title: form.title, description: form.description, category_id: form.category_id || null,
      reward_amount: parseFloat(form.reward_amount) || 0, deadline: form.deadline || null,
      instructions: form.instructions || null, status: "open",
    });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/bounties"); }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div style={{ minHeight: '100vh', background: 'var(--oc-bg)', padding: '32px' }} className="page-wrapper">
      <Link href="/bounties" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 24, fontSize: 12, color: "var(--oc-text-muted)", textDecoration: "none", fontFamily: "var(--oc-font)" }}>
        ← Back to Bounties
      </Link>

      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", marginBottom: 4 }}>Create Bounty</h1>
        <p style={{ fontSize: 12, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Define a new task for human workers to complete</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", alignItems: "start" }}>
        <div className="oc-card">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Title</label>
              <input className="oc-input" placeholder="e.g., Verify product images for accuracy" value={form.title} onChange={(e) => update("title", e.target.value)} required style={{ fontFamily: "var(--oc-font)" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Description</label>
              <textarea className="oc-input" placeholder="Describe what needs to be done in detail..." value={form.description} onChange={(e) => update("description", e.target.value)} required style={{ fontFamily: "var(--oc-font)", minHeight: 80, resize: "vertical" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Category</label>
                <select className="oc-input" value={form.category_id} onChange={(e) => update("category_id", e.target.value)} style={{ fontFamily: "var(--oc-font)" }}>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Reward ($)</label>
                <input className="oc-input" type="number" min="1" step="0.01" placeholder="50.00" value={form.reward_amount} onChange={(e) => update("reward_amount", e.target.value)} required style={{ fontFamily: "var(--oc-font)" }} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Deadline (optional)</label>
              <input className="oc-input" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} style={{ fontFamily: "var(--oc-font)" }} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, fontFamily: "var(--oc-font)" }}>Requirements</label>
              <textarea className="oc-input" placeholder="List specific requirements or deliverables..." value={form.instructions} onChange={(e) => update("instructions", e.target.value)} style={{ fontFamily: "var(--oc-font)", minHeight: 80, resize: "vertical" }} />
            </div>
            {error && <p style={{ color: "var(--oc-red)", fontSize: 12, marginBottom: 16, fontFamily: "var(--oc-font)" }}>{error}</p>}
            <button type="submit" className="oc-btn oc-btn-primary" disabled={loading}>
              {loading ? "Creating..." : "Create Bounty"}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="oc-card" style={{ position: "sticky", top: "24px" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "var(--oc-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "16px", fontFamily: "var(--oc-font)" }}>Preview</h3>
          {form.reward_amount && <span className="oc-badge oc-badge-cyan" style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: "inline-block" }}>${form.reward_amount}</span>}
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--oc-text)", marginBottom: 12, fontFamily: "var(--oc-font)" }}>{form.title || "Untitled Bounty"}</h2>
          <p style={{ fontSize: 13, color: "var(--oc-text-muted)", lineHeight: 1.7, fontFamily: "var(--oc-font)" }}>{form.description || "Description will appear here..."}</p>
          {form.category_id && <span className="oc-badge oc-badge-gray" style={{ marginTop: 16, display: "inline-block" }}>{categories.find((c) => c.id === form.category_id)?.name || "Category"}</span>}
          {form.deadline && <p style={{ fontSize: 12, color: "var(--oc-text-muted)", marginTop: 12, fontFamily: "var(--oc-font)" }}>📅 Due: {new Date(form.deadline).toLocaleDateString()}</p>}
        </div>
      </div>
    </div>
  );
}
