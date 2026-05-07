"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/dashboard", label: "dashboard" },
  { href: "/bounties", label: "bounties" },
  { href: "/team", label: "team" },
  { href: "/workers", label: "workers" },
  { href: "/settings", label: "settings" },
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
      if (!data.session) {
        router.replace("/login");
      } else {
        const role = data.session.user.user_metadata?.role;
        if (role !== "admin") {
          router.replace("/login");
        } else {
          setSession(data.session);
        }
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--oc-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--oc-font)" }}>
        <div style={{ fontFamily: "var(--oc-font)", color: "var(--oc-text-muted)", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "var(--oc-bg)", fontFamily: "var(--oc-font)" }}>
      {!isMobile && (
        <aside style={{
          width: "240px", minHeight: "100vh",
          background: "var(--oc-bg)", borderRight: "1px solid var(--oc-border)",
          padding: "24px 0",
          position: "fixed", left: 0, top: 0,
          fontFamily: "var(--oc-font)",
        }}>
          <div style={{ padding: "0 20px", marginBottom: "32px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div style={{
                width: "32px", height: "32px",
                background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
                borderRadius: "6px",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--oc-accent)", fontWeight: 600, fontSize: "13px",
              }}>H</div>
              <div>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--oc-text)", letterSpacing: "-0.01em", display: "block", fontFamily: "var(--oc-font)" }}>HireAHuman</span>
                <span style={{ fontSize: "10px", color: "var(--oc-text-muted)", fontWeight: 500, fontFamily: "var(--oc-font)" }}>admin</span>
              </div>
            </Link>
          </div>
          <nav>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center",
                padding: "10px 20px", margin: "2px 12px",
                fontSize: "12px", fontWeight: 500,
                color: pathname === link.href ? "var(--oc-text)" : "var(--oc-text-muted)",
                background: pathname === link.href ? "var(--oc-surface)" : "transparent",
                border: pathname === link.href ? "1px solid var(--oc-border)" : "1px solid transparent",
                transition: "all 150ms",
                textDecoration: "none",
                fontFamily: "var(--oc-font)",
                letterSpacing: "0.02em",
              }}>
                <span style={{ 
                  width: "6px", height: "6px", 
                  borderRadius: "50%",
                  background: pathname === link.href ? "var(--oc-accent)" : "transparent",
                  marginRight: "8px",
                  boxShadow: pathname === link.href ? "0 0 8px rgba(34,211,238,0.5)" : "none"
                }} />
                {link.label}
              </Link>
            ))}
          </nav>
          <button onClick={handleLogout} style={{
            margin: "24px 20px 0",
            padding: "10px 16px",
            fontSize: "12px",
            fontWeight: 500,
            background: "transparent",
            border: "1px solid var(--oc-border)",
            borderRadius: "6px",
            color: "var(--oc-text-muted)",
            cursor: "pointer",
            fontFamily: "var(--oc-font)",
            width: "calc(100% - 40px)",
          }}>Sign out</button>
        </aside>
      )}

      {isMobile && (
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          height: "56px", background: "var(--oc-bg)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--oc-border)", display: "flex",
          alignItems: "center", justifyContent: "space-between", padding: "0 16px",
          fontFamily: "var(--oc-font)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px", height: "30px", background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
              borderRadius: "6px", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--oc-accent)", fontWeight: 600, fontSize: "12px",
            }}>H</div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--oc-text)" }}>admin</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} style={{ 
            padding: "8px", fontSize: "16px", 
            background: "var(--oc-surface)", border: "1px solid var(--oc-border)",
            borderRadius: "6px", color: "var(--oc-text)", cursor: "pointer"
          }}>=</button>
        </nav>
      )}

      {isMobile && mobileOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99 }} onClick={() => setMobileOpen(false)}>
          <div style={{ 
            width: "240px", background: "var(--oc-bg)", height: "100%", 
            padding: "24px 0", borderRight: "1px solid var(--oc-border)",
            fontFamily: "var(--oc-font)",
          }} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center",
                padding: "12px 20px", fontSize: "12px", fontWeight: 500,
                color: pathname === link.href ? "var(--oc-text)" : "var(--oc-text-muted)",
                background: pathname === link.href ? "var(--oc-surface)" : "transparent",
                border: pathname === link.href ? "1px solid var(--oc-border)" : "1px solid transparent",
                textDecoration: "none",
                letterSpacing: "0.02em",
              }}>
                <span style={{ 
                  width: "6px", height: "6px", 
                  borderRadius: "50%",
                  background: pathname === link.href ? "var(--oc-accent)" : "transparent",
                  marginRight: "8px",
                  boxShadow: pathname === link.href ? "0 0 8px rgba(34,211,238,0.5)" : "none"
                }} />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : "240px",
        padding: isMobile ? "72px 16px 24px" : "32px",
        maxWidth: isMobile ? "100%" : "56rem",
        background: "var(--oc-bg)",
        minHeight: "100vh",
        fontFamily: "var(--oc-font)",
      }}>
        <div style={{
          background: "var(--oc-bg-secondary)",
          border: "1px solid var(--oc-border)",
          borderRadius: "12px",
          padding: isMobile ? "20px" : "28px",
          minHeight: "calc(100vh - 96px)",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}