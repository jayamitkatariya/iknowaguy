"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  { id: "errands", name: "Errands", icon: "🏃" },
  { id: "delivery", name: "Delivery", icon: "📦" },
  { id: "photography", name: "Photography", icon: "📷" },
  { id: "inspection", name: "Inspection", icon: "🔍" },
  { id: "research", name: "Research", icon: "📋" },
  { id: "mystery-shopping", name: "Mystery Shopping", icon: "🛒" },
];

export default function CreateBountyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    category_id: "errands",
    reward_amount: "",
    location_address: "",
    deadline: "",
    is_remote: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const { error: err } = await supabase.from("bounties").insert({
      tenant_id: userData?.tenant_id || "a1111111-1111-1111-1111-111111111111",
      created_by_user_id: user.id,
      title: form.title,
      description: form.description,
      instructions: form.instructions,
      category_id: form.category_id,
      reward_amount: form.reward_amount ? parseFloat(form.reward_amount) : 0,
      location_address: form.location_address || null,
      deadline: form.deadline || null,
      status: "open",
    });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    setToast({ type: "success", message: "Bounty created successfully!" });
    setTimeout(() => router.push("/bounties"), 800);
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      {/* Toast */}
      {toast && (
        <div className="toast-container" style={{ top: 80 }}>
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? "✓" : "⚠"} {toast.message}
          </div>
        </div>
      )}

      <div className="mb-2">
        <Link href="/bounties" className="task-back" style={{ display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 16 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Bounties
        </Link>
        <h1 className="page-title">Create New Bounty</h1>
        <p className="page-subtitle">Post a task that human workers can pick up.</p>
      </div>

      {error && (
        <div className="toast toast-error" style={{ marginBottom: 20, position: "static", animation: "none" }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="profile-form">
            <label>Task Title *</label>
            <input
              type="text"
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Review 5 Coffee Shops in San Francisco"
              required
            />

            <label>Description *</label>
            <textarea
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief overview of the task..."
              required
              style={{ minHeight: 80, resize: "vertical", marginBottom: 20 }}
            />

            <label>Instructions *</label>
            <textarea
              className="input"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Describe the task in detail — what needs to be done, what evidence to submit..."
              required
              style={{ minHeight: 120, resize: "vertical", marginBottom: 20 }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 4 }}>
              <div>
                <label>Category *</label>
                <select
                  className="input select"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  style={{ marginBottom: 0 }}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Reward (USD) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.reward_amount}
                  onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
                  placeholder="75.00"
                  required
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20, marginBottom: 4 }}>
              <div>
                <label>Location Address</label>
                <input
                  type="text"
                  className="input"
                  value={form.location_address}
                  onChange={(e) => setForm({ ...form, location_address: e.target.value })}
                  placeholder="San Francisco, CA"
                  style={{ marginBottom: 0 }}
                />
              </div>
              <div>
                <label>Deadline</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form.is_remote}
                onChange={(e) => setForm({ ...form, is_remote: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#6366f1" }}
              />
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Remote task (no location required)</span>
            </label>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, paddingTop: 4 }}>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Creating..." : "Create Bounty"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
