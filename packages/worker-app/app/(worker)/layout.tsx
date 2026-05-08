"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const navLinks = [
  { href: "/browse", label: "Browse" },
  { href: "/my-tasks", label: "My Tasks" },
  { href: "/earnings", label: "Earnings" },
  { href: "/notifications", label: "Alerts" },
  { href: "/profile", label: "Profile" },
  { href: "/dashboard", label: "Dashboard" },
];

export default function WorkerLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [checking, setChecking] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login?redirect=" + encodeURIComponent(pathname));
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.session.user.id)
        .single();

      if (cancelled) return;

      if (profile?.role !== "human") {
        router.push("/login");
        return;
      }

      setChecking(false);
    };
    checkSession();
    return () => { cancelled = true; };
  }, [router, pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--oc-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--oc-font)" }}>
        <div style={{ fontFamily: "var(--oc-font)", color: "var(--oc-text-muted)", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--oc-bg)", fontFamily: "var(--oc-font)", color: "var(--oc-text)" }}>
      <nav style={{
        background: "var(--oc-bg-secondary)",
        borderBottom: "1px solid var(--oc-border)",
        padding: "0 24px",
        height: "56px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/browse" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div style={{
              width: "30px", height: "30px", background: "var(--oc-accent)",
              borderRadius: "6px", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--oc-bg)", fontWeight: 700, fontSize: "14px",
            }}>H</div>
            <span style={{ fontSize: "14px", fontWeight: 600, letterSpacing: "0.02em", color: "var(--oc-text)" }}>HireAHuman</span>
          </Link>
          {!isMobile && navLinks.map((link) => (
            <Link key={link.href} href={link.href} style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 500,
              color: pathname === link.href ? "var(--oc-accent)" : "var(--oc-text-muted)",
              background: pathname === link.href ? "var(--oc-accent-dim)" : "transparent",
              transition: "all 150ms",
              border: pathname === link.href ? "1px solid var(--oc-accent-border)" : "1px solid transparent",
              textDecoration: "none",
            }}>
              {link.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isMobile && (
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{
              padding: "8px",
              borderRadius: "6px",
              fontSize: "18px",
              background: "transparent",
              border: "none",
              color: "var(--oc-text)",
              cursor: "pointer",
            }}>|||</button>
          )}
          <button onClick={handleLogout} style={{
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: 500,
            background: "var(--oc-surface)",
            border: "1px solid var(--oc-border)",
            color: "var(--oc-text-muted)",
            cursor: "pointer",
            fontFamily: "var(--oc-font)",
          }}>Sign out</button>
        </div>
      </nav>

      {isMobile && mobileOpen && (
        <div style={{
          position: "fixed", top: "56px", left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", zIndex: 99,
        }} onClick={() => setMobileOpen(false)}>
          <div style={{
            background: "var(--oc-bg-secondary)",
            borderBottom: "1px solid var(--oc-border)",
            padding: "12px",
          }} onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 14px", borderRadius: "6px",
                fontSize: "14px", fontWeight: 500,
                color: pathname === link.href ? "var(--oc-accent)" : "var(--oc-text-muted)",
                background: pathname === link.href ? "var(--oc-accent-dim)" : "transparent",
                textDecoration: "none",
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <main style={{
        padding: "88px 24px 40px",
        maxWidth: "56rem",
        margin: "0 auto",
        color: "var(--oc-text)",
      }}>
        <div style={{
          background: "var(--oc-bg-secondary)",
          border: "1px solid var(--oc-border)",
          borderRadius: "12px",
          padding: "28px",
          minHeight: "calc(100vh - 140px)",
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}
