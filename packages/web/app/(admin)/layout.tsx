"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import "../globals.css";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bounties", label: "Bounties" },
  { href: "/team", label: "Team" },
  { href: "/workers", label: "Workers" },
  { href: "/settings", label: "Settings" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        setSession(data.session);
      }
      setChecking(false);
    };
    checkSession();
  }, [router]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-base)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
      }}
    >
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{
            background: "var(--bg-card)",
            borderRight: "1px solid var(--border)",
            width: "240px",
            minHeight: "100vh",
            padding: "24px 0",
            position: "fixed",
            left: 0,
            top: 0,
            display: "flex",
            flexDirection: "column",
            zIndex: 100,
          }}
        >
          <div style={{ padding: "0 24px", marginBottom: "32px" }}>
            <Link
              href="/dashboard"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                background:
                  "linear-gradient(90deg, var(--accent), var(--success))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textDecoration: "none",
              }}
            >
              HireAHuman
            </Link>
            <div
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--text-secondary)",
                marginTop: "4px",
              }}
            >
              Admin
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1 }}>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 20px",
                    margin: "2px 12px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "14px",
                    fontWeight: 500,
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    background: isActive
                      ? "var(--accent-light)"
                      : "transparent",
                    textDecoration: "none",
                    transition: "all 150ms ease",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ padding: "0 24px", marginTop: "auto" }}>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              style={{
                width: "100%",
                padding: "10px",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 150ms ease",
              }}
            >
              Sign Out
            </button>
          </div>
        </aside>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <>
          <nav
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              height: "64px",
              background: "var(--bg-card)",
              borderBottom: "1px solid var(--border)",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              zIndex: 100,
            }}
          >
            <Link
              href="/dashboard"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                background:
                  "linear-gradient(90deg, var(--accent), var(--success))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textDecoration: "none",
              }}
            >
              HireAHuman
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "5px",
                padding: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              aria-label="Toggle menu"
            >
              <span
                style={{
                  width: "22px",
                  height: "2px",
                  background: "var(--text-primary)",
                  borderRadius: "2px",
                  transition: "all 200ms ease",
                  transform: mobileOpen
                    ? "rotate(45deg) translate(5px, 5px)"
                    : "none",
                }}
              />
              <span
                style={{
                  width: "22px",
                  height: "2px",
                  background: "var(--text-primary)",
                  borderRadius: "2px",
                  transition: "all 200ms ease",
                  opacity: mobileOpen ? 0 : 1,
                }}
              />
              <span
                style={{
                  width: "22px",
                  height: "2px",
                  background: "var(--text-primary)",
                  borderRadius: "2px",
                  transition: "all 200ms ease",
                  transform: mobileOpen
                    ? "rotate(-45deg) translate(5px, -5px)"
                    : "none",
                }}
              />
            </button>
          </nav>

          {mobileOpen && (
            <div
              style={{
                position: "fixed",
                top: "64px",
                left: 0,
                right: 0,
                background: "var(--bg-card)",
                borderBottom: "1px solid var(--border)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                zIndex: 99,
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "14px",
                      fontWeight: 500,
                      color: isActive
                        ? "var(--accent)"
                        : "var(--text-secondary)",
                      background: isActive
                        ? "var(--accent-light)"
                        : "transparent",
                      textDecoration: "none",
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </>
      )}

      <main
        style={{
          flex: 1,
          marginLeft: isMobile ? 0 : "240px",
          marginTop: isMobile ? "64px" : 0,
          padding: "32px 24px",
          maxWidth: isMobile ? "100%" : "calc(100% - 240px)",
          width: "100%",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
