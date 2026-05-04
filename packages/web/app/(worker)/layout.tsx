"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const navLinks = [
  { href: "/browse", label: "Browse", icon: "🔍" },
  { href: "/my-tasks", label: "My Tasks", icon: "📋" },
  { href: "/earnings", label: "Earnings", icon: "💰" },
  { href: "/notifications", label: "Alerts", icon: "🔔" },
  { href: "/profile", label: "Profile", icon: "👤" },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Top Nav */}
      <nav style={{
        background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)", padding: "0 24px",
        height: "64px", display: "flex", alignItems: "center",
        justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Link href="/browse" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px", background: "var(--accent)",
              borderRadius: "8px", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700, fontSize: "15px",
            }}>H</div>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em" }}>HireAHuman</span>
          </Link>
          {!isMobile && navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{
              padding: "8px 14px", borderRadius: "var(--radius-sm)",
              fontSize: "14px", fontWeight: 500,
              color: pathname === link.href ? "var(--accent)" : "var(--text-secondary)",
              background: pathname === link.href ? "var(--accent-light)" : "transparent",
              transition: "all 200ms",
            }}>
              {link.label}
            </Link>
          ))}
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{
            padding: "8px", borderRadius: "var(--radius-sm)", fontSize: "20px",
          }}>☰</button>
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
        <div style={{
          position: "fixed", top: "64px", left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.3)", zIndex: 99,
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            background: "var(--bg-card)", padding: "16px",
            borderBottom: "1px solid var(--border)",
          }} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 16px", borderRadius: "var(--radius-sm)",
                fontSize: "15px", fontWeight: 500,
                color: pathname === link.href ? "var(--accent)" : "var(--text-primary)",
                background: pathname === link.href ? "var(--accent-light)" : "transparent",
              }}>
                <span>{link.icon}</span> {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container" style={{ padding: "40px 24px", maxWidth: "1100px" }}>
        {children}
      </main>
    </div>
  );
}
