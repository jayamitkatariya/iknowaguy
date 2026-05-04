"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/bounties", label: "Bounties", icon: "🎯" },
  { href: "/team", label: "Team", icon: "👥" },
  { href: "/workers", label: "Workers", icon: "🔧" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace("/login"); }
      else { setSession(data.session); }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton" style={{ width: "200px", height: "24px" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-base)" }}>
      {/* Sidebar — desktop */}
      {!isMobile && (
        <aside style={{
          width: "260px", minHeight: "100vh", background: "var(--bg-card)",
          borderRight: "1px solid var(--border)", padding: "32px 0",
          position: "fixed", left: 0, top: 0,
        }}>
          <div style={{ padding: "0 24px", marginBottom: "32px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", background: "var(--accent)",
                borderRadius: "10px", display: "flex", alignItems: "center",
                justifyContent: "center", color: "white", fontWeight: 700, fontSize: "17px",
              }}>H</div>
              <span style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>HireAHuman</span>
            </Link>
          </div>
          <nav>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 24px", margin: "2px 16px",
                borderRadius: "var(--radius-sm)", fontSize: "14px", fontWeight: 500,
                color: pathname === link.href ? "var(--accent)" : "var(--text-secondary)",
                background: pathname === link.href ? "var(--accent-light)" : "transparent",
                transition: "all 200ms",
              }}>
                <span>{link.icon}</span> {link.label}
              </Link>
            ))}
          </nav>
        </aside>
      )}

      {/* Mobile top bar */}
      {isMobile && (
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: "60px", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--border)", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px", background: "var(--accent)",
              borderRadius: "8px", display: "flex", alignItems: "center",
              justifyContent: "center", color: "white", fontWeight: 700, fontSize: "15px",
            }}>H</div>
            <span style={{ fontSize: "16px", fontWeight: 700 }}>Admin</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ padding: "8px", fontSize: "20px" }}>☰</button>
        </nav>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 99 }} onClick={() => setMobileOpen(false)}>
          <div style={{ width: "260px", background: "var(--bg-card)", height: "100%", padding: "24px 0" }} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "14px 24px", fontSize: "15px", fontWeight: 500,
                color: pathname === link.href ? "var(--accent)" : "var(--text-primary)",
                background: pathname === link.href ? "var(--accent-light)" : "transparent",
              }}>
                <span>{link.icon}</span> {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : "260px",
        padding: isMobile ? "80px 24px 24px" : "40px 32px",
        maxWidth: "1100px",
      }}>
        {children}
      </main>
    </div>
  );
}
