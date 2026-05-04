"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

const CATEGORY_ICONS: Record<string, string> = {
  Errands: "🏃",
  Delivery: "📦",
  Photography: "📷",
  Inspection: "🔍",
  Installation: "🔧",
  Cleaning: "🧹",
  default: "📋",
}

function countdownText(deadline: string | null) {
  if (!deadline) return null
  const end = new Date(deadline).getTime()
  const now = Date.now()
  const diff = end - now
  if (diff <= 0) return "Expired"
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor(diff / (1000 * 60))
  if (days > 1) return `${days} days left`
  if (days === 1) return `1 day left`
  if (hours > 1) return `${hours} hours left`
  if (hours === 1) return `1 hour left`
  return `${minutes} min left`
}

function isUrgent(deadline: string | null) {
  if (!deadline) return false
  const diff = new Date(deadline).getTime() - Date.now()
  return diff > 0 && diff < 1000 * 60 * 60 * 24
}

function statusBadge(status: string) {
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

interface Bounty {
  id: string
  title: string
  description: string | null
  reward_amount: number
  currency: string
  status: string
  deadline: string | null
  created_at: string
  category_id: string | null
  categories: { name: string } | null
  location_address: string | null
  location_city: string | null
}

export default function BrowsePage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"newest" | "reward">("newest")
  const [selectedCategory, setSelectedCategory] = useState("")

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: cats }, { data: rows }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase
          .from("bounties")
          .select("*, categories(name)")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(200),
      ])
      setCategories(cats || [])
      setBounties(rows || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let list = [...bounties]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((b) => b.title.toLowerCase().includes(q))
    }

    if (selectedCategory) {
      list = list.filter((b) => b.category_id === selectedCategory)
    }

    if (sortBy === "reward") {
      list.sort((a, b) => b.reward_amount - a.reward_amount)
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    return list
  }, [bounties, search, sortBy, selectedCategory])

  function formatCurrency(amount: number, currency: string) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Browse Tasks</h1>
      <p className="page-subtitle">Find open bounties and start earning.</p>

      <div className="filter-bar">
        <input
          type="text"
          className="input"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320, flex: 1 }}
        />
        <select
          className="input select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="input select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "newest" | "reward")}
          style={{ maxWidth: 180 }}
        >
          <option value="newest">Newest</option>
          <option value="reward">Highest Reward</option>
        </select>
      </div>

      <div style={{ marginBottom: 16, fontSize: 13, color: "#6b7280" }}>
        {loading ? "Loading tasks..." : `${filtered.length} task${filtered.length !== 1 ? "s" : ""} found`}
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
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-sub">Try adjusting your filters or check back later.</div>
        </div>
      ) : (
        filtered.map((bounty) => {
          const icon = CATEGORY_ICONS[bounty.categories?.name || ""] || CATEGORY_ICONS.default
          const timer = countdownText(bounty.deadline)
          const urgent = isUrgent(bounty.deadline)
          return (
            <a key={bounty.id} href={`/task/${bounty.id}`} className="bounty-card">
              <div className="bounty-card-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                    <h3 className="bounty-card-title">{bounty.title}</h3>
                    <span className={`badge ${statusBadge(bounty.status)}`}>{bounty.status}</span>
                  </div>
                  <p className="bounty-card-desc">
                    {bounty.description?.slice(0, 140)}
                    {bounty.description && bounty.description.length > 140 ? "…" : ""}
                  </p>
                  <div className="bounty-card-meta">
                    {bounty.categories?.name && (
                      <span className="meta-tag">{bounty.categories.name}</span>
                    )}
                    {bounty.location_city && (
                      <span className="meta-tag">📍 {bounty.location_city}</span>
                    )}
                    {timer && (
                      <span className={`countdown-timer ${urgent ? "urgent" : ""}`}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {timer}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 90, flexShrink: 0 }}>
                  <div className="bounty-card-reward">
                    {formatCurrency(bounty.reward_amount, bounty.currency)}
                  </div>
                  <div className="bounty-card-reward-label">reward</div>
                </div>
              </div>
            </a>
          )
        })
      )}
    </div>
  )
}
