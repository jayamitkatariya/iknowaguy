"use client"

import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  type: string
  created_at: string
  bounty_id: string | null
}

export default function EarningsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from("payment_transactions")
        .select("id, amount, currency, status, type, created_at, bounty_id")
        .eq("human_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200)
      setPayments(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    const pending = payments.filter((p) => p.status === "pending" || p.status === "processing").reduce((sum, p) => sum + (p.amount || 0), 0)
    const paid = payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + (p.amount || 0), 0)
    return { total, pending, paid }
  }, [payments])

  const monthly = useMemo(() => {
    const map = new Map<string, number>()
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      map.set(key, 0)
    }
    payments.forEach((p) => {
      const d = new Date(p.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (map.has(key)) {
        map.set(key, map.get(key)! + (p.amount || 0))
      }
    })
    return Array.from(map.entries()).map(([key, value]) => {
      const [year, month] = key.split("-")
      const label = new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" })
      return { label, value, key }
    })
  }, [payments])

  const maxValue = Math.max(...monthly.map((m) => m.value), 1)

  function formatCurrency(amount: number, currency?: string) {
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(amount)
    } catch {
      return `$${amount.toFixed(2)}`
    }
  }

  function statusBadgeClass(status: string) {
    if (status === "completed") return "badge-green"
    if (status === "pending" || status === "processing") return "badge-amber"
    if (status === "failed" || status === "refunded") return "badge-red"
    return "badge-gray"
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Earnings</h1>
      <p className="page-subtitle">Track your income and payment history.</p>

      {/* Stats */}
      <div className="earnings-summary">
        <div className="card">
          <div className="stat-label">Total Earned</div>
          <div className="stat-value" style={{ color: "#10b981" }}>{formatCurrency(stats.total)}</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="card">
          <div className="stat-label">Pending</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>{formatCurrency(stats.pending)}</div>
          <div className="stat-sub">Awaiting payout</div>
        </div>
        <div className="card">
          <div className="stat-label">Paid</div>
          <div className="stat-value" style={{ color: "#818cf8" }}>{formatCurrency(stats.paid)}</div>
          <div className="stat-sub">Released to you</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="section-title">Last 6 Months</div>
        <div className="chart-bar-container">
          {monthly.map((m) => (
            <div
              key={m.key}
              className="chart-bar"
              style={{ height: `${(m.value / maxValue) * 100}%`, minHeight: m.value > 0 ? 4 : 2 }}
            >
              {m.value > 0 && (
                <div className="chart-bar-value">{formatCurrency(m.value).replace(".00", "")}</div>
              )}
              <div className="chart-bar-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* History Table */}
      <div className="section-title">Payment History</div>
      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="activity-item">
              <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: "30%" }} />
              </div>
              <div className="skeleton" style={{ width: 60, height: 16 }} />
            </div>
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">💸</div>
          <div className="empty-state-title">No payments yet</div>
          <div className="empty-state-sub">Complete tasks to start earning.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td style={{ textTransform: "capitalize" }}>{p.type.replace(/_/g, " ")}</td>
                  <td>
                    <span className={`badge ${statusBadgeClass(p.status)}`}>{p.status}</span>
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: "#818cf8" }}>
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
