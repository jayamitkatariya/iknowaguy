"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const p = data || {};
    setProfile(p);
    setBio(p.bio || "");
    setSkills((p.skills || []).join(", "));
    setLocation(p.location || "");
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const updates = {
      id: user.id,
      bio: bio.trim(),
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      location: location.trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(updates, { onConflict: "id" });

    if (error) {
      setMessage("Error saving profile: " + error.message);
    } else {
      setMessage("Profile saved successfully!");
      fetchProfile();
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)",
          padding: "40px",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            height: "24px",
            width: "40%",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-sm)",
            marginBottom: "24px",
          }}
        />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              height: "48px",
              width: "100%",
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
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
          Profile
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
          Manage your worker profile and skills
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
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                resize: "vertical",
                minHeight: "100px",
                outline: "none",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
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
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Skills
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, TypeScript, Design"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
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
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-secondary)",
                marginTop: "6px",
              }}
            >
              Separate skills with commas
            </p>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: "6px",
              }}
            >
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. San Francisco, CA"
              style={{
                width: "100%",
                padding: "10px 14px",
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "14px",
                color: "var(--text-primary)",
                outline: "none",
                transition: "border-color 150ms ease, box-shadow 150ms ease",
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

          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px",
              background: "var(--accent)",
              color: "white",
              border: "1px solid var(--accent)",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
              transition: "all 150ms ease",
            }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
