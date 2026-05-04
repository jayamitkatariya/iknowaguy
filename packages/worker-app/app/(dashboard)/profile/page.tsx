"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Profile {
  id?: string
  full_name?: string
  display_name?: string
  bio?: string
  skills?: string[]
  location_city?: string
  location_country?: string
  timezone?: string
  rating?: number
  completed_tasks?: number
  notification_preferred_channels?: string[]
  notification_slack?: string
  notification_telegram?: string
  notification_sms?: string
  avatar_url?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({})
  const [stats, setStats] = useState({ earned: 0, done: 0, rating: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const [{ data: prof }, { data: bounties }] = await Promise.all([
        supabase.from("human_profiles").select("*").eq("user_id", user.id).single(),
        supabase
          .from("bounties")
          .select("reward_amount, status")
          .eq("assigned_human_id", user.id)
          .in("status", ["completed", "paid"]),
      ])

      const p = prof || {}
      setProfile(p)

      const earned = (bounties || []).reduce((sum: number, b: any) => sum + (b.reward_amount || 0), 0)
      setStats({
        earned,
        done: p.completed_tasks || (bounties || []).length || 0,
        rating: p.rating || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const updatePayload: Partial<Profile> = {
      bio: profile.bio,
      skills: profile.skills,
      location_city: profile.location_city,
      location_country: profile.location_country,
      timezone: profile.timezone,
      notification_preferred_channels: profile.notification_preferred_channels,
      notification_slack: profile.notification_slack,
      notification_telegram: profile.notification_telegram,
      notification_sms: profile.notification_sms,
    }

    await supabase.from("human_profiles").update(updatePayload).eq("user_id", user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function initials(name?: string) {
    if (!name) return "?"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  function formatCurrency(amount: number) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <span className="loading-state-icon">⏳</span>
          <div>Loading profile...</div>
        </div>
      </div>
    )
  }

  const displayName = profile.display_name || profile.full_name || "Worker"
  const location = [profile.location_city, profile.location_country].filter(Boolean).join(", ") || "Location not set"

  return (
    <div className="page-container">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Manage your public info and preferences.</p>

      {/* Header */}
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {initials(displayName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f9fafb", marginBottom: 4 }}>{displayName}</div>
          <div style={{ fontSize: 14, color: "#6b7280", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {location}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 32 }}>
        <div className="card">
          <div className="stat-label">Earnings</div>
          <div className="stat-value" style={{ color: "#10b981" }}>{formatCurrency(stats.earned)}</div>
          <div className="stat-sub">Total earned</div>
        </div>
        <div className="card">
          <div className="stat-label">Tasks Done</div>
          <div className="stat-value" style={{ color: "#818cf8" }}>{stats.done}</div>
          <div className="stat-sub">Completed &amp; paid</div>
        </div>
        <div className="card">
          <div className="stat-label">Rating</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {stats.rating > 0 ? stats.rating.toFixed(1) : "—"}
            {stats.rating > 0 && (
              <span style={{ fontSize: 18, marginLeft: 4, color: "#f59e0b" }}>★</span>
            )}
          </div>
          <div className="stat-sub">Average rating</div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <div className="section-title">Edit Profile</div>
        <form onSubmit={handleSave} className="profile-form">
          <label>Bio</label>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell agents about yourself..."
          />

          <label>Skills (comma separated)</label>
          <input
            type="text"
            value={(profile.skills || []).join(", ")}
            onChange={(e) =>
              setProfile({
                ...profile,
                skills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="design, photography, delivery"
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label>City</label>
              <input
                type="text"
                value={profile.location_city || ""}
                onChange={(e) => setProfile({ ...profile, location_city: e.target.value })}
              />
            </div>
            <div>
              <label>Country</label>
              <input
                type="text"
                value={profile.location_country || ""}
                onChange={(e) => setProfile({ ...profile, location_country: e.target.value })}
              />
            </div>
          </div>

          <label>Timezone</label>
          <input
            type="text"
            value={profile.timezone || ""}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            placeholder="America/New_York"
          />

          <div className="section-title" style={{ marginTop: 8 }}>Notification Preferences</div>
          {["email", "slack", "telegram", "sms"].map((channel) => (
            <div key={channel} style={{ marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={(profile.notification_preferred_channels || []).includes(channel)}
                  onChange={(e) => {
                    const channels = profile.notification_preferred_channels || []
                    const updated = e.target.checked
                      ? [...channels, channel]
                      : channels.filter((c) => c !== channel)
                    setProfile({ ...profile, notification_preferred_channels: updated })
                  }}
                  style={{ width: 18, height: 18, accentColor: "#6366f1", cursor: "pointer" }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, color: "#d1d5db", textTransform: "capitalize" }}>
                  {channel}
                </span>
              </label>
              {channel !== "email" && (
                <input
                  type="text"
                  placeholder={`${channel} handle / number`}
                  value={(profile as any)[`notification_${channel}`] || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, [`notification_${channel}`]: e.target.value } as Profile)
                  }
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <span className="loading-state-icon" style={{ fontSize: 14, margin: 0, animation: "spin 1s linear infinite", display: "inline-block" }}>
                    ⏳
                  </span>
                  Saving...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
            {saved && (
              <span className="toast-success" style={{ position: "static", animation: "none", fontSize: 13, padding: "6px 12px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Saved successfully
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
