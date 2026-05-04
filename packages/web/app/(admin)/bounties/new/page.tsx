"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateBountyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", description: "", category: "", reward: "", deadline: "", requirements: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.from("bounties").insert({
      title: form.title, description: form.description, category: form.category,
      reward: parseFloat(form.reward) || 0, deadline: form.deadline || null,
      requirements: form.requirements, status: "open",
    });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/bounties"); }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <div className="page-header">
        <h1>Create Bounty</h1>
        <p>Define a new task for human workers to complete</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px", alignItems: "start" }}>
        <div className="card" style={{ padding: "32px" }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Title</label>
              <input className="input" placeholder="e.g., Verify product images for accuracy" value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="label">Description</label>
              <textarea className="textarea" placeholder="Describe what needs to be done in detail..." value={form.description} onChange={(e) => update("description", e.target.value)} required />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="form-group">
                <label className="label">Category</label>
                <select className="select" value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Select category</option>
                  <option value="verification">Verification</option>
                  <option value="research">Research</option>
                  <option value="creative">Creative</option>
                  <option value="data_entry">Data Entry</option>
                  <option value="testing">Testing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Reward ($)</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="50.00" value={form.reward} onChange={(e) => update("reward", e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Deadline (optional)</label>
              <input className="input" type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Requirements</label>
              <textarea className="textarea" placeholder="List specific requirements or deliverables..." value={form.requirements} onChange={(e) => update("requirements", e.target.value)} style={{ minHeight: "80px" }} />
            </div>
            {error && <p style={{ color: "var(--error)", fontSize: "14px", marginBottom: "16px" }}>{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? "Creating..." : "Create Bounty"}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="card" style={{ padding: "28px", position: "sticky", top: "100px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px" }}>Preview</h3>
          {form.reward && <span className="badge badge-success" style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>${form.reward}</span>}
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>{form.title || "Untitled Bounty"}</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{form.description || "Description will appear here..."}</p>
          {form.category && <span className="badge badge-neutral" style={{ marginTop: "16px" }}>{form.category}</span>}
          {form.deadline && <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px" }}>📅 Due: {new Date(form.deadline).toLocaleDateString()}</p>}
        </div>
      </div>
    </div>
  );
}
