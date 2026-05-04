"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

type Tab = "active" | "completed" | "all"

const TAB_LABELS: Record<Tab, string> = {
  active: "Active",
  completed: "Completed",
  all: "All",
}

interface Bounty {
  id: string
  title: string
  reward_amount: number
  currency: string
  status: string
  deadline: string | null
  category_id: string | null
  categories: { name: string } | null
  location_address: string | null
  location_city: string | null
  updated_at: string
}

const ACTIVE_STATUSES = new Set(["assigned", "accepted", "in_progress", "submitted", "reviewing"])
const COMPLETED_STATUSES = new Set(["completed", "paid", "disputed", "cancelled", "refunded"])

function statusBadgeClass(status: string) {
  const map: Record<string, string> = {
    open: "badge-green",
    accepted: "badge-blue",
    assigned: "badge-blue",
    in_progress: "badge-amber",
    submitted: "badge-amber",
    reviewing: "badge-amber",
    completed: "badge-blue",
    paid: "badge-green",
    disputed: "badge-red",
    cancelled: "badge-gray",
    refunded: "badge-gray",
  }
  return map[status] || "badge-gray"
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>("active")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from("bounties")
        .select("*, categories(name)")
        .eq("assigned_human_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(200)
      setTasks(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tasks.filter((t) => {
    if (tab === "active") return ACTIVE_STATUSES.has(t.status)
    if (tab === "completed") return COMPLETED_STATUSES.has(t.status)
    return true
  })

  function formatCurrency(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  const emptyIcons: Record<Tab, string> = {
    active: "🏃",
    completed: "✅",
    all: "📋",
  }

  const emptyTitles: Record<Tab, string> = {
    active: "No active tasks",
    completed: "No completed tasks",
    all: "No tasks yet",
  }

  const emptySubs: Record<Tab, string> = {
    active: "Browse open tasks and accept one to get started.",
    completed: "Finish a task and it will appear here.",
    all: "Your task history will show up here.",
  }

  return (
    <div className="page-container">
      <h1 className="page-title">My Tasks</h1>
      <p className="page-subtitle">Track your active work and past completions.</p>

      <div className="tabs">
        {(["active", "completed", "all"] as Tab[]).map((t) => (
          <button
            key={t}
            className={tab === t ? "tab tab-active" : "tab"}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
            <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 11 }}>
              {t === "active"
                ? tasks.filter((x) => ACTIVE_STATUSES.has(x.status)).length
                : t === "completed"
                ? tasks.filter((x) => COMPLETED_STATUSES.has(x.status)).length
                : tasks.length}
            </span>
          </button>
        ))}
      </div>

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
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">{emptyIcons[tab]}</div>
          <div className="empty-state-title">{emptyTitles[tab]}</div>
          <div className="empty-state-sub">{emptySubs[tab]}</div>
        </div>
      ) : (
        <div className="activity-list">
          {filtered.map((task) => (
            <a key={task.id} href={`/task/${task.id}`} className="activity-item" style={{ textDecoration: "none" }}>
              <div
                className="activity-icon"
                style={{
                  background:
                    task.status === "paid" || task.status === "completed"
                      ? "#022c22"
                      : task.status === "submitted" || task.status === "reviewing"
                      ? "#2a1b05"
                      : "#1e1b4b",
                }}
              >
                {task.status === "paid" || task.status === "completed"
                  ? "💰"
                  : task.status === "submitted" || task.status === "reviewing"
                  ? "⏳"
                  : "🎯"}
              </div>
              <div className="activity-content">
                <div className="activity-title">{task.title}</div>
                <div className="activity-meta">
                  {task.categories?.name && <span>{task.categories.name}</span>}
                  {task.categories?.name && task.location_city && <span> · </span>}
                  {task.location_city && <span>{task.location_city}</span>}
                  {task.deadline && (
                    <>
                      <span> · </span>
                      <span>Due {new Date(task.deadline).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div className="activity-amount">{formatCurrency(task.reward_amount, task.currency)}</div>
                <span className={`badge ${statusBadgeClass(task.status)}`} style={{ fontSize: 10, padding: "1px 8px" }}>
                  {task.status}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
