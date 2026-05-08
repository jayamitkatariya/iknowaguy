"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewBountyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    category_id: "",
    reward: "",
    deadline: "",
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await supabase.from("categories").select("*").order("name");
        setCategories(data || []);
      } catch {} finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("Not authenticated. Please login first.");
      router.push("/login");
      return;
    }

    try {
      const { error: insertErr } = await supabase.from("bounties").insert({
        title: formData.title,
        description: formData.description,
        instructions: formData.instructions || null,
        category_id: formData.category_id || null,
        reward_amount: parseFloat(formData.reward) || 0,
        currency: "usd",
        deadline: formData.deadline || null,
        status: "open",
        payment_status: "pending",
      });

      if (insertErr) throw new Error(insertErr.message);

      router.push("/dashboard/bounties");
    } catch (err: any) {
      setError(err.message || "Failed to create bounty");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link href="/dashboard/bounties" style={{ color: "var(--oc-text-muted)", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", marginBottom: "1rem", textDecoration: "none" }}>
          ← Back to Bounties
        </Link>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Create New Bounty</h1>
        <p style={{ color: "var(--oc-text-muted)" }}>Post a task for human workers to complete</p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="oc-card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Basic Information</h2>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Title <span style={{ color: "var(--oc-red)" }}>*</span>
            </label>
            <input id="title" name="title" type="text" value={formData.title} onChange={handleChange} className="oc-input" placeholder="e.g., Verify restaurant listing on Yelp" required />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="description" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Description <span style={{ color: "var(--oc-red)" }}>*</span>
            </label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} className="oc-input" placeholder="Describe the task in detail..." required rows={4} style={{ resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="instructions" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Instructions
            </label>
            <textarea id="instructions" name="instructions" value={formData.instructions} onChange={handleChange} className="oc-input" placeholder="Step-by-step instructions for the worker..." rows={3} style={{ resize: "vertical" }} />
          </div>

          <div>
            <label htmlFor="category_id" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Category
            </label>
            <select id="category_id" name="category_id" value={formData.category_id} onChange={handleChange} className="oc-input" disabled={loadingCategories}>
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ""}{cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="oc-card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem" }}>Reward & Deadline</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label htmlFor="reward" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
                Reward (USD) <span style={{ color: "var(--oc-red)" }}>*</span>
              </label>
              <input id="reward" name="reward" type="number" min="0.01" step="0.01" value={formData.reward} onChange={handleChange} className="oc-input" placeholder="$10.00" required />
            </div>
            <div>
              <label htmlFor="deadline" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
                Deadline
              </label>
              <input id="deadline" name="deadline" type="datetime-local" value={formData.deadline} onChange={handleChange} className="oc-input" />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: "1rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", borderRadius: "8px", color: "var(--oc-red)", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link href="/dashboard/bounties" className="oc-btn oc-btn-ghost">Cancel</Link>
          <button type="submit" className="oc-btn oc-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Bounty"}
          </button>
        </div>
      </form>
    </div>
  );
}
