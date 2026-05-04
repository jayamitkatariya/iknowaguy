"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Activity {
  id: string
  title: string
  status: string
  reward_amount: number
  currency: string
  updated_at: string
}

interface Stats {
  totalEarned: number
  tasksCompleted: number
  activeTasks: number
  availableBounties: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalEarned: 0,
    tasksCompleted: 0,
    activeTasks: 0,
    availableBounties: 0,
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      await loadStats(user.id)
      await loadActivity(user.id)
      setLoading(false)
    }
    init()
  }, [])

  async function loadStats(uid: string) {
    try {
      const [paidRes, completedRes, activeRes, availableRes] = await Promise.all([
        supabase
          .from("bounties")
          .select("reward_amount")
          .eq("assigned_human_id", uid)
          .eq("status", "paid"),
        supabase
          .from("bounties")
          .select("id", { count: "exact", head: true })
          .eq("assigned_human_id", uid)
          .in("status", ["paid", "completed"]),
        supabase
          .from("bounties")
          .select("id", { count: "exact", head: true })
          .eq("assigned_human_id", uid)
          .in("status", ["assigned", "submitted"]),
        supabase
          .from("bounties")
          .select("id", { count: "exact", head: true })
          .eq("status", "open"),
      ])

      const totalEarned = (paidRes.data || []).reduce((sum: number, row: any) => sum + (row.reward_amount || 0), 0)

      setStats({
        totalEarned,
        tasksCompleted: completedRes.count || 0,
        activeTasks: activeRes.count || 0,
        availableBounties: availableRes.count || 0,
      })
      setError(null)
    } catch (e: any) {
      setError("Failed to load stats: " + e.message)
    }
  }

  async function loadActivity(uid: string) {
    try {
      const { data } = await supabase
        .from("bounties")
        .select("id, title, status, reward_amount, currency, updated_at")
        .eq("assigned_human_id", uid)
        .order("updated_at", { ascending: false })
        .limit(8)

      setActivities(data || [])
    } catch {
      setActivities([])
    }
  }

  function formatCurrency(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  function timeAgo(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    if (diff < 60) return "Just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return date.toLocaleDateString()
  }

  function statusIcon(status: string) {
    if (status === "paid") return "💰"
    if (status === "completed") return "✅"
    if (status === "submitted") return "📤"
    if (status === "assigned") return "🎯"
    if (status === "open") return "🔓"
    return "📝"
  }

  function statusBg(status: string) {
    if (status === "paid") return "#022c22"
    if (status === "completed") return "#0c1e3f"
    if (status === "submitted") return "#2a1b05"
    if (status === "assigned") return "#1e1b4b"
    return "#1f2937"
  }

  const statCards = [
    { label: "Total Earned", value: formatCurrency(stats.totalEarned, "USD"), sub: "All time earnings", color: "#10b981" },
    { label: "Tasks Completed", value: String(stats.tasksCompleted), sub: "Finished & paid", color: "#818cf8" },
    { label: "Active Tasks", value: String(stats.activeTasks), sub: "In progress", color: "#f59e0b" },
    { label: "Available", value: String(stats.availableBounties), sub: "Open bounties now", color: "#34d399" },
  ]

  return (
    <div className="page-container">
      <div style={{ marginBottom: "2rem" }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back. Here is your performance at a glance.</p>
      </div>

      {/* Error */}
      {error && (
        <div className="toast toast-error" style={{ marginBottom: "1.5rem", position: "static", animation: "none" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s) => (
          <div key={s.label} className="card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{loading ? "—" : s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <a href="/browse" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Browse Tasks
        </a>
        <a href="/my-tasks" className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          My Tasks
        </a>
        <a href="/earnings" className="btn btn-ghost">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          Earnings
        </a>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="section-title">Recent Activity</div>
        {loading ? (
          <div className="card">
            {[1, 2, 3].map((i) => (
              <div key={i} className="activity-item">
                <div className="skeleton skeleton-circle" />
                <div style={{ flex: 1 }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="card empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No activity yet</div>
            <div className="empty-state-sub">Accept a task to see your activity here.</div>
          </div>
        ) : (
          <div className="activity-list">
            {activities.map((a) => (
              <a key={a.id} href={`/task/${a.id}`} className="activity-item" style={{ textDecoration: "none" }}>
                <div className="activity-icon" style={{ background: statusBg(a.status) }}>
                  {statusIcon(a.status)}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{a.title}</div>
                  <div className="activity-meta">{a.status} · {timeAgo(a.updated_at)}</div>
                </div>
                <div className="activity-amount">
                  {formatCurrency(a.reward_amount, a.currency)}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
