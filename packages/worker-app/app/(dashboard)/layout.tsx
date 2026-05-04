"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/browse", label: "Browse Tasks" },
  { href: "/my-tasks", label: "My Tasks" },
  { href: "/earnings", label: "Earnings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u)
      if (u) {
        const { data } = await supabase
          .from("human_profiles")
          .select("display_name, avatar_url")
          .eq("user_id", u.id)
          .single()
        setProfile(data || {})
        fetchUnread(u.id)
      }
    }
    loadUser()
  }, [])

  async function fetchUnread(uid: string) {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("read", false)
    setUnreadCount(count || 0)
  }

  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel("notifications-count")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchUnread(user.id)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user?.id])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const initials = profile?.display_name
    ? profile.display_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "?"

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#f9fafb", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Top nav */}
      <header className="nav-bar">
        {/* Logo */}
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div className="nav-logo-icon">H</div>
          <span className="nav-logo">
            Hire<span style={{ color: "#6366f1" }}>AHuman</span>
          </span>
        </a>

        {/* Desktop Nav */}
        <nav className="nav-links">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <a
                key={item.href}
                href={item.href}
                className={active ? "nav-link nav-link-active" : "nav-link"}
              >
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* Right section */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Notification Bell */}
          <a
            href="/notifications"
            className="nav-bell"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {unreadCount > 0 && (
              <span className="nav-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
            )}
          </a>

          {/* User Menu */}
          <div ref={userMenuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 8px 4px 4px",
                borderRadius: 10,
                transition: "background 0.15s ease",
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = "#1f2937" }}
              onMouseOut={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <div className="nav-avatar">{initials}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f9fafb", lineHeight: 1.3 }}>
                  {profile?.display_name || user?.email?.split("@")[0] || "Worker"}
                </div>
                <div style={{ fontSize: 11, color: "#10b981", display: "flex", alignItems: "center", gap: 4, lineHeight: 1.3 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                  Online
                </div>
              </div>
            </button>

            <div className={userMenuOpen ? "nav-user-menu open" : "nav-user-menu"}>
              <a href="/profile" className="nav-user-menu-item" onClick={() => setUserMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Profile
              </a>
              <a href="/earnings" className="nav-user-menu-item" onClick={() => setUserMenuOpen(false)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                Earnings
              </a>
              <div style={{ height: 1, background: "#1f2937", margin: "4px 0" }} />
              <button onClick={handleSignOut} className="nav-user-menu-item" style={{ color: "#fca5a5" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <div className={mobileOpen ? "mobile-drawer open" : "mobile-drawer"}>
        <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)} />
        <div className="mobile-drawer-panel">
          <button className="mobile-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, padding: "0 14px" }}>
            <div className="nav-avatar">{initials}</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb" }}>
                {profile?.display_name || user?.email?.split("@")[0] || "Worker"}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            {navItems.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={active ? "mobile-drawer-link active" : "mobile-drawer-link"}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span style={{
                      marginLeft: "auto",
                      minWidth: 20,
                      height: 20,
                      padding: "0 6px",
                      background: "#ef4444",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 800,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </a>
              )
            })}
          </div>

          <div style={{ height: 1, background: "#1f2937", margin: "8px 14px 16px" }} />
          <button
            onClick={() => { setMobileOpen(false); handleSignOut() }}
            className="mobile-drawer-link"
            style={{ color: "#fca5a5" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        {children}
      </main>
    </div>
  )
}
