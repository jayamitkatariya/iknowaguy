"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const userId = session.user.id;
      const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
      setNotifications(data || []);
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const getIcon = (type: string) => {
    const map: Record<string, string> = {
      task_assigned: "📋", message_received: "💬", submission_reviewed: "✅",
      dispute_raised: "⚠️", payment_received: "💰", deadline_reminder: "⏰",
      verification_update: "🔒",
    };
    return map[type] || "🔔";
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--oc-text)", fontFamily: "var(--oc-font)", letterSpacing: "-0.02em" }}>Notifications</h1>
        <p style={{ fontSize: 14, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>Stay updated on your bounties and payments</p>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1,2,3].map((i) => (
            <div key={i} style={{ background: "var(--oc-bg-secondary)", border: "1px solid var(--oc-border)", borderRadius: "6px", height: "72px", padding: "20px" }}>
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="oc-empty-state">
          <div className="oc-empty-icon"></div>
          <div className="oc-empty-title">All caught up</div>
          <p style={{ fontSize: 13, color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>You&apos;ll see notifications here when there&apos;s activity</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {notifications.map((n) => (
            <div key={n.id} onClick={() => !n.is_read && markRead(n.id)} style={{
              background: "var(--oc-bg-secondary)",
              border: "1px solid var(--oc-border)",
              borderRadius: "8px",
              padding: "20px 24px",
              display: "flex", alignItems: "center", gap: "16px",
              cursor: n.is_read ? "default" : "pointer",
              opacity: n.is_read ? 0.7 : 1,
              fontFamily: "var(--oc-font)",
            }}>
              <span style={{ fontSize: "24px" }}>{getIcon(n.type)}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", fontWeight: n.is_read ? 400 : 600, color: "var(--oc-text)" }}>{n.content}</p>
                <p style={{ fontSize: "12px", color: "var(--oc-text-muted)", marginTop: "4px" }}>{new Date(n.created_at).toLocaleString()}</p>
              </div>
              {!n.is_read && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--oc-accent)" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}