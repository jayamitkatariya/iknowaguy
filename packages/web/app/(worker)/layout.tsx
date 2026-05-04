"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import "../globals.css";

const navLinks = [
  { href: "/browse", label: "Browse Tasks" },
  { href: "/my-tasks", label: "My Tasks" },
  { href: "/earnings", label: "Earnings" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
];

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-base)",
      }}
    >
      <nav
        style={{
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border)",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <Link
          href="/browse"
          style={{
            fontSize: "20px",
            fontWeight: 700,
            background: "linear-gradient(90deg, var(--accent), var(--success))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            textDecoration: "none",
          }}
        >
          HireAHuman
        </Link>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                    gap: "6px",
                    padding: "8px 14px",
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
                    transition: "all 150ms ease",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
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
        )}
      </nav>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
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
              pathname === link.href || pathname.startsWith(link.href + "/");
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
        </div>
      )}

      <main
        style={{
          flex: 1,
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {children}
      </main>
    </div>
  );
}
