"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "6px",
              letterSpacing: "-0.02em",
            }}
          >
            Notifications
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)" }}>
            {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              padding: "10px 20px",
              borderRadius: "var(--radius-sm)",
              fontSize: "14px",
              fontWeight: 500,
              background: "var(--accent)",
              color: "white",
              border: "1px solid var(--accent)",
              cursor: "pointer",
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "grid", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "24px",
                height: "80px",
              }}
            >
              <div
                style={{
                  height: "14px",
                  width: "80%",
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-sm)",
                }}
              />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            No notifications
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              maxWidth: "400px",
            }}
          >
            You&apos;re all caught up!
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "20px 24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                opacity: notification.read ? 0.7 : 1,
                transition: "opacity 150ms ease",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  {!notification.read && (
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "var(--accent)",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--text-primary)",
                      margin: 0,
                      fontWeight: notification.read ? 400 : 500,
                    }}
                  >
                    {notification.message}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: "var(--text-secondary)",
                  }}
                >
                  {new Date(notification.created_at).toLocaleString()}
                </span>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "13px",
                    fontWeight: 500,
                    background: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
