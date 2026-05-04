"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface Notification {
  id: string
  title: string
  content: string | null
  type: string
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, string> = {
  task_assigned: "🎯",
  message_received: "💬",
  submission_reviewed: "✅",
  dispute_raised: "⚠️",
  payment_received: "💰",
  deadline_reminder: "⏰",
  verification_update: "🛡️",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      setUserId(user.id)

      const { data } = await supabase
        .from("notifications")
        .select("id, title, content, type, is_read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100)

      setNotifications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("notifications-page")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === (payload.new as Notification).id ? (payload.new as Notification) : n))
            )
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  async function markAllRead() {
    if (!userId) return
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="page-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-ghost" onClick={markAllRead} style={{ fontSize: 13 }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="notification-item">
              <div className="skeleton skeleton-circle" style={{ width: 32, height: 32 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" style={{ width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🔔</div>
          <div className="empty-state-title">No notifications</div>
          <div className="empty-state-sub">When something happens, you'll see it here.</div>
        </div>
      ) : (
        <div className="activity-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notification-item ${!n.is_read ? "unread" : ""}`}
              onClick={() => markAsRead(n.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") markAsRead(n.id)
              }}
            >
              <div className={`notification-dot ${n.is_read ? "read" : ""}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="notification-title">
                  {TYPE_ICONS[n.type] || "🔔"} {n.title}
                </div>
                {n.content && <div className="notification-body">{n.content}</div>}
                <div className="notification-time">{timeAgo(n.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
