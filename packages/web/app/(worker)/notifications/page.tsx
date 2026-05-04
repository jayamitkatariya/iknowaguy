"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type: string) => {
    const map: Record<string, string> = {
      bounty_created: "🆕", bounty_accepted: "✅", bounty_submitted: "📤",
      bounty_approved: "🎉", bounty_rejected: "❌", payment_released: "💰",
    };
    return map[type] || "🔔";
  };

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>Stay updated on your bounties and payments</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1,2,3].map((i) => <div key={i} className="card" style={{ height: "72px" }}><div className="skeleton skeleton-text" /></div>)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="icon">🔔</div>
          <h3>All caught up</h3>
          <p>You&apos;ll see notifications here when there&apos;s activity</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.read && markRead(n.id)} className="card" style={{
              padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px",
              cursor: "pointer", opacity: n.read ? 0.7 : 1,
              background: n.read ? "var(--bg-base)" : "var(--bg-card)",
            }}>
              <span style={{ fontSize: "24px" }}>{getIcon(n.type)}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: n.read ? 400 : 600 }}>{n.message}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent)" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
