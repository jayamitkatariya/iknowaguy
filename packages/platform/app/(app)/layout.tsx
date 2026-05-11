"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRequireAuth } from "@/lib/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Bounties", href: "/bounties" },
  { label: "Browse Tasks", href: "/browse" },
  { label: "My Tasks", href: "/my-tasks" },
  { label: "Earnings", href: "/earnings" },
  { label: "API Keys", href: "/api-keys" },
  { label: "Profile", href: "/profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { loading, user, signOut } = useRequireAuth();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleSignOut = () => signOut();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--oc-bg)",
        fontFamily: "var(--oc-font)",
        color: "var(--oc-text)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <p style={{ color: "var(--oc-text-muted)" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--oc-bg)",
      fontFamily: "var(--oc-font)",
      color: "var(--oc-text)",
    }}>
      <header style={{
        background: "var(--oc-bg-secondary)",
        borderBottom: "1px solid var(--oc-border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <nav style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "56px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{
                width: "32px",
                height: "32px",
                background: "var(--oc-accent)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{ color: "#000", fontWeight: 700, fontSize: "14px" }}>H</span>
              </div>
              <span style={{ color: "var(--oc-text-strong)", fontSize: "14px", fontWeight: 600 }}>
                iknowaguy
              </span>
            </Link>

            {!isMobile && (
              <div style={{ display: "flex", gap: "4px" }}>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: pathname === item.href || pathname.startsWith(item.href + "/") 
                        ? "var(--oc-accent)" 
                        : "var(--oc-text-muted)",
                      background: pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "var(--oc-accent-dim)" 
                        : "transparent",
                      textDecoration: "none",
                      transition: "all 150ms ease",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "12px", color: "var(--oc-text-muted)", display: isMobile ? "none" : "block" }}>
              {user?.email}
            </span>
            {isMobile && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--oc-text)",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "8px",
                }}
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            )}
            {!isMobile && (
              <button
                onClick={handleSignOut}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "var(--oc-bg-tertiary)",
                  border: "1px solid var(--oc-border)",
                  color: "var(--oc-text-muted)",
                  cursor: "pointer",
                  fontFamily: "var(--oc-font)",
                }}
              >
                Sign out
              </button>
            )}
          </div>
        </nav>

        {isMobile && menuOpen && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            padding: "12px 24px",
            background: "var(--oc-bg-secondary)",
            borderTop: "1px solid var(--oc-border)",
            gap: "4px",
          }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  color: pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "var(--oc-accent)" 
                    : "var(--oc-text)",
                  background: pathname === item.href || pathname.startsWith(item.href + "/")
                    ? "var(--oc-accent-dim)" 
                    : "transparent",
                  textDecoration: "none",
                }}
              >
                {item.label}
              </Link>
            ))}
            <button
              onClick={() => { setMenuOpen(false); handleSignOut(); }}
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--oc-bg-tertiary)",
                border: "1px solid var(--oc-border)",
                color: "var(--oc-red)",
                cursor: "pointer",
                fontFamily: "var(--oc-font)",
                textAlign: "left",
                marginTop: "8px",
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>

      <main style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {children}
      </main>
    </div>
  );
}
