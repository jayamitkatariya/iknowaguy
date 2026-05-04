"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  )},
  { href: "/bounties", label: "Bounties", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  )},
  { href: "/team", label: "Team", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  )},
  { href: "/settings", label: "Settings", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  )},
  { href: "/workers", label: "Workers", icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )},
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login");
      } else {
        setUser(data.user);
      }
      setLoading(false);
    });
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1e" }}>
        <div className="loading-state">
          <div className="loading-state-icon">⏳</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const pageName = pathname.replace("/", "").replace(/-/g, " ") || "Dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0a0f1e", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Mobile overlay */}
      <div className={mobileOpen ? "admin-mobile-overlay open" : "admin-mobile-overlay"} onClick={() => setMobileOpen(false)} />

      {/* Sidebar */}
      <aside className={mobileOpen ? "admin-sidebar mobile-open" : "admin-sidebar"}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            <div className="admin-sidebar-logo-icon">H</div>
            <span>Hire<span style={{ color: "#6366f1" }}>AHuman</span></span>
          </div>
          <div className="admin-sidebar-sub">Admin Dashboard</div>
        </div>
        <nav className="admin-sidebar-nav">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={active ? "admin-sidebar-link admin-sidebar-link-active" : "admin-sidebar-link"}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-email">{user.email}</div>
          <button onClick={handleLogout} className="admin-sidebar-signout">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="admin-main">
        {/* Header */}
        <header className="admin-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="admin-mobile-toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <h2 className="admin-header-title">{pageName}</h2>
          </div>
          <div className="admin-header-user">
            <span className="admin-header-email">{user.email}</span>
            <div className="nav-avatar">
              {user.email?.slice(0, 2).toUpperCase() || "A"}
            </div>
          </div>
        </header>
        {/* Content */}
        <main style={{ flex: 1, background: "#0a0f1e" }}>{children}</main>
      </div>
    </div>
  );
}
