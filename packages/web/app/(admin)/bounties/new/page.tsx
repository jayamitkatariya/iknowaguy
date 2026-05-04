"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewBountyPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reward, setReward] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });
    setCategories(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessage("Error: Not authenticated");
      setLoading(false);
      return;
    }

    // Get user to find tenant_id
    const { data: userData } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    const tenantId = userData?.tenant_id;
    if (!tenantId) {
      setMessage("Error: No tenant found");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("bounties").insert({
      tenant_id: tenantId,
      title: title.trim(),
      description: description.trim(),
      instructions: instructions.trim() || null,
      category_id: categoryId || null,
      reward_amount: parseFloat(reward) || 0,
      location_address: location.trim() || null,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      status: "open",
    });

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      router.push("/bounties");
      return;
    }

    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
    fontSize: "14px",
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "6px",
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
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
          New Bounty
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Create a new task bounty
        </p>
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "32px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Photograph storefront conditions"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task in detail..."
              rows={4}
              required
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "100px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Instructions</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step instructions for the worker..."
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
                minHeight: "80px",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--accent)";
                e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  ...inputStyle,
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='%236B705C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                  paddingRight: "36px",
                  cursor: "pointer",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Reward ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                placeholder="0.00"
                required
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <div>
              <label style={labelStyle}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 123 Market St, San Francisco"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
            <div>
              <label style={labelStyle}>Deadline</label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent)";
                  e.target.style.boxShadow = "0 0 0 3px var(--accent-light)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {message && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
                background: message.startsWith("Error")
                  ? "#F8D7DA"
                  : "var(--accent-light)",
                color: message.startsWith("Error")
                  ? "var(--error)"
                  : "var(--accent)",
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => router.push("/bounties")}
              style={{
                padding: "10px 20px",
                background: "var(--bg-elevated)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 20px",
                background: "var(--accent)",
                color: "white",
                border: "1px solid var(--accent)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "all 150ms ease",
              }}
            >
              {loading ? "Creating..." : "Create Bounty"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
