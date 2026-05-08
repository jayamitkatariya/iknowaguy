"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/categories`);
        if (res.ok) {
          const result = await res.json();
          setCategories(result.data || []);
        }
      } catch {
        // categories are optional — fail silently
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const apiKey = document.cookie.split('; ').find(row => row.startsWith('hah_api_key='))?.split('=')[1];
    const tenantId = document.cookie.split('; ').find(row => row.startsWith('hah_tenant_id='))?.split('=')[1];

    if (!apiKey || !tenantId) {
      setError("Not authenticated. Please login first.");
      router.push("/login");
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    try {
      const response = await fetch(`${apiUrl}/api/bounties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Tenant-ID": tenantId,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions || undefined,
          category_id: formData.category_id || undefined,
          reward_amount: parseFloat(formData.reward) || 0,
          currency: "usd",
          deadline: formData.deadline || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create bounty");
        setIsSubmitting(false);
        return;
      }

      router.push("/bounties");
    } catch (err: any) {
      setError(err.message || "Failed to create bounty");
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <header style={{ marginBottom: "2rem" }}>
        <Link
          href="/bounties"
          style={{
            color: "var(--oc-text-muted)",
            fontSize: "0.875rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginBottom: "1rem",
            textDecoration: "none",
          }}
        >
          ← Back to Bounties
        </Link>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--oc-text)" }}>
          Create New Bounty
        </h1>
        <p style={{ color: "var(--oc-text-muted)" }}>
          Post a task for human workers to complete
        </p>
      </header>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="oc-card">
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--oc-text)" }}>
            Basic Information
          </h2>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="title" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Title <span style={{ color: "var(--oc-red)" }}>*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className="oc-input"
              placeholder="e.g., Verify restaurant listing on Yelp"
              required
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="description" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Description <span style={{ color: "var(--oc-red)" }}>*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="oc-input"
              placeholder="Describe the task in detail. Be specific about what the worker needs to do and what constitutes a successful completion."
              required
              rows={4}
              style={{ resize: "vertical" }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label htmlFor="instructions" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              className="oc-input"
              placeholder="Step-by-step instructions the worker should follow. Add any specific requirements or quality standards."
              rows={3}
              style={{ resize: "vertical" }}
            />
          </div>

          <div>
            <label htmlFor="category_id" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              className="oc-input"
              disabled={loadingCategories}
            >
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
          <h2 style={{ fontSize: "1rem", fontWeight: "600", marginBottom: "1rem", color: "var(--oc-text)" }}>
            Rewards &amp; Requirements
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label htmlFor="reward" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
                Reward (USD) <span style={{ color: "var(--oc-red)" }}>*</span>
              </label>
              <input
                id="reward"
                name="reward"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.reward}
                onChange={handleChange}
                className="oc-input"
                placeholder="$10.00"
                required
              />
            </div>

            <div>
              <label htmlFor="deadline" style={{ display: "block", fontSize: "0.875rem", marginBottom: "0.5rem", color: "var(--oc-text-muted)" }}>
                Deadline
              </label>
              <input
                id="deadline"
                name="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={handleChange}
                className="oc-input"
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{
            padding: "1rem",
            background: "rgba(220, 38, 38, 0.1)",
            border: "1px solid rgba(220, 38, 38, 0.3)",
            borderRadius: "8px",
            color: "var(--oc-red)",
            fontSize: "0.875rem",
          }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <Link href="/bounties" className="oc-btn oc-btn-ghost">
            Cancel
          </Link>
          <button
            type="submit"
            className="oc-btn oc-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Bounty"}
          </button>
        </div>
      </form>
    </div>
  );
}
