"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
        setName(data.user.user_metadata?.name || "");
        setEmail(data.user.email || "");
      }
    };
    getUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { name } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Manage your account settings</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "32px" }}>
        {/* Avatar Card */}
        <div className="card" style={{ padding: "40px", textAlign: "center" }}>
          <div style={{
            width: "96px", height: "96px", borderRadius: "50%",
            background: "var(--accent-light)", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: "36px", fontWeight: 700, color: "var(--accent)",
            margin: "0 auto 20px",
          }}>
            {name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "4px" }}>{name || "User"}</h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{email}</p>
          <div className="divider" />
          <div style={{ display: "flex", justifyContent: "center", gap: "32px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>0</p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Completed</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: 700 }}>$0</p>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Earned</p>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card" style={{ padding: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Edit Profile</h3>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" value={email} disabled style={{ opacity: 0.6 }} />
          </div>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
