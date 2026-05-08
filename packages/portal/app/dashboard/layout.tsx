"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("human_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "agent") {
        router.push("/login");
        return;
      }

      setUser(session.user);
      setRole(profile?.role);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "◈" },
    { href: "/dashboard/bounties", label: "Bounties", icon: "◎" },
    { href: "/dashboard/bounties/new", label: "New Bounty", icon: "⊕" },
    { href: "/dashboard/api-keys", label: "API Keys", icon: "⟨/⟩" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--oc-bg)", fontFamily: "var(--oc-font)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>◈</div>
          <p style={{ color: "var(--oc-text-muted)", fontSize: "14px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--oc-bg)" }}>
      <aside style={{
        width: "240px",
        borderRight: "1px solid var(--oc-border)",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        background: "var(--oc-bg-secondary)",
      }}>
        <div style={{ padding: "0 20px", marginBottom: "32px" }}>
          <Link href="/" style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--oc-accent)",
            textDecoration: "none",
            fontFamily: "var(--oc-font)",
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            ◈ HireAHuman
          </Link>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: isActive ? "var(--oc-accent)" : "var(--oc-text-muted)",
                  textDecoration: "none",
                  background: isActive ? "rgba(245, 158, 11, 0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--oc-accent)" : "2px solid transparent",
                  fontFamily: "var(--oc-font)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--oc-text)";
                    e.currentTarget.style.background = "var(--oc-bg-tertiary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "var(--oc-text-muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span style={{ fontSize: "16px", opacity: 0.8 }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "20px", borderTop: "1px solid var(--oc-border)" }}>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--oc-text)", fontFamily: "var(--oc-font)" }}>
              {user?.email?.split("@")[0] || "Agent"}
            </p>
            <p style={{ fontSize: "11px", color: "var(--oc-text-muted)", fontFamily: "var(--oc-font)" }}>
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "8px 12px",
              background: "transparent",
              border: "1px solid var(--oc-border)",
              borderRadius: "6px",
              color: "var(--oc-text-muted)",
              fontSize: "12px",
              cursor: "pointer",
              fontFamily: "var(--oc-font)",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "32px", maxWidth: "1200px" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
