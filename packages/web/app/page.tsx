"use client";

import { useState } from "react";

export default function Home() {
  const [copiedInstall, setCopiedInstall] = useState(false);

  const copyInstall = () => {
    navigator.clipboard.writeText("npx hireahuman init");
    setCopiedInstall(true);
    setTimeout(() => setCopiedInstall(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* ── Navigation ── */}
      <nav style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 48px",
        height: "72px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px", height: "36px", background: "var(--accent)",
            borderRadius: "10px", display: "flex", alignItems: "center",
            justifyContent: "center", color: "white", fontWeight: 700, fontSize: "18px",
          }}>H</div>
          <span style={{ fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            HireAHuman
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "36px" }}>
          <a href="#features" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", transition: "color 200ms" }}>Features</a>
          <a href="#pricing" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", transition: "color 200ms" }}>Pricing</a>
          <a href="https://github.com/jaykatariya/hireahuman" style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)", transition: "color 200ms" }}>GitHub</a>
          <a href="/login" className="btn btn-ghost btn-sm">Sign in</a>
          <a href="/signup" className="btn btn-primary btn-sm">Get Started</a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        padding: "120px 48px 100px",
        textAlign: "center",
        maxWidth: "900px",
        margin: "0 auto",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          padding: "6px 16px", borderRadius: "999px",
          background: "var(--accent-light)", color: "var(--accent)",
          fontSize: "13px", fontWeight: 600, marginBottom: "32px",
        }}>
          ✨ Open Source & Free
        </div>
        <h1 style={{
          fontSize: "64px", fontWeight: 700, lineHeight: 1.1,
          letterSpacing: "-0.04em", marginBottom: "24px",
        }}>
          AI Agents <span className="gradient-text">Hire Humans</span>
        </h1>
        <p style={{
          fontSize: "20px", color: "var(--text-secondary)",
          maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          The open-source MCP framework that lets AI agents create bounties, hire humans, and pay them — all through the Model Context Protocol.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "48px" }}>
          <a href="/signup" className="btn btn-primary btn-lg">Get Started Free</a>
          <a href="https://github.com/jaykatariya/hireahuman" className="btn btn-secondary btn-lg">⭐ Star on GitHub</a>
        </div>

        {/* Install command */}
        <div onClick={copyInstall} style={{
          display: "inline-flex", alignItems: "center", gap: "12px",
          background: "#1C1917", color: "#F5F2EC", padding: "16px 28px",
          borderRadius: "var(--radius-md)", cursor: "pointer",
          fontFamily: "'SF Mono', 'Fira Code', monospace", fontSize: "15px",
          transition: "transform 200ms", boxShadow: "var(--shadow-lg)",
        }}>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>$</span>
          <span>npx hireahuman init</span>
          <span style={{ fontSize: "13px", color: "#78716C", marginLeft: "8px" }}>
            {copiedInstall ? "✓ Copied!" : "Click to copy"}
          </span>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: "100px 48px", background: "var(--bg-card)" }}>
        <div className="container" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>How It Works</p>
          <h2 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.03em" }}>Three Steps. That&apos;s It.</h2>
        </div>
        <div className="container grid-3">
          {[
            { step: "1", icon: "🤖", title: "AI Creates a Bounty", desc: "Your AI agent uses the MCP tool to describe a task, set a reward, and publish it to the marketplace." },
            { step: "2", icon: "👤", title: "Human Completes It", desc: "A human worker browses available tasks, accepts one, does the work, and submits evidence." },
            { step: "3", icon: "💰", title: "Payment Released", desc: "The AI agent reviews the submission and releases payment. Done. Everyone wins." },
          ].map((item) => (
            <div key={item.step} style={{
              background: "var(--bg-base)", borderRadius: "var(--radius-lg)",
              padding: "40px 32px", textAlign: "center", border: "1px solid var(--border)",
            }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "16px",
                background: "var(--accent-light)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: "24px", margin: "0 auto 20px",
              }}>{item.icon}</div>
              <div style={{
                fontSize: "12px", fontWeight: 700, color: "var(--accent)",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px",
              }}>Step {item.step}</div>
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>{item.title}</h3>
              <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={{ padding: "100px 48px" }}>
        <div className="container" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Features</p>
          <h2 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.03em" }}>Everything You Need</h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "500px", margin: "12px auto 0" }}>
            A complete platform for AI-to-human task delegation
          </p>
        </div>
        <div className="container grid-3">
          {[
            { icon: "🔌", title: "MCP Integration", desc: "Works with Claude, ChatGPT, Cursor, Windsurf, and any MCP-compatible AI agent." },
            { icon: "💳", title: "Smart Payments", desc: "Stripe-powered escrow. Funds held safely until work is approved." },
            { icon: "📎", title: "File Evidence", desc: "Workers upload screenshots, documents, and files as proof of completion." },
            { icon: "🔔", title: "Notifications", desc: "Slack, Telegram, Email, SMS — get notified on every bounty event." },
            { icon: "👥", title: "Team Management", desc: "Invite team members, assign roles, and manage bounties together." },
            { icon: "🔓", title: "Fully Open Source", desc: "MIT licensed. Self-host, customize, and extend. No vendor lock-in." },
          ].map((f) => (
            <div key={f.title} className="card" style={{ padding: "32px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>{f.title}</h3>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Integrations ── */}
      <section style={{ padding: "80px 48px", background: "var(--bg-card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "32px" }}>Works With Your Favorite AI Tools</p>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
            {["Claude", "ChatGPT", "Cursor", "Windsurf", "VS Code"].map((name) => (
              <div key={name} style={{
                padding: "12px 28px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--bg-base)",
                fontSize: "14px", fontWeight: 600, color: "var(--text-primary)",
              }}>{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "100px 48px" }}>
        <div className="container" style={{ textAlign: "center", marginBottom: "64px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>Pricing</p>
          <h2 style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.03em" }}>Simple, Transparent Pricing</h2>
          <p style={{ fontSize: "16px", color: "var(--text-secondary)", maxWidth: "500px", margin: "12px auto 0" }}>
            Start free. Scale when you&apos;re ready.
          </p>
        </div>
        <div className="container grid-3">
          {[
            {
              name: "Free", price: "$0", period: "/month",
              features: ["10 bounties/month", "Community support", "Basic integrations", "File evidence uploads"],
              cta: "Get Started", highlight: false,
            },
            {
              name: "Pro", price: "$49", period: "/month",
              features: ["Unlimited bounties", "Priority support", "All integrations", "Team management", "Advanced analytics", "Custom webhooks"],
              cta: "Start Free Trial", highlight: true,
            },
            {
              name: "Enterprise", price: "Custom", period: "",
              features: ["Dedicated support", "Custom SLA", "On-premise deployment", "SSO & SAML", "Audit logs", "Dedicated account manager"],
              cta: "Contact Sales", highlight: false,
            },
          ].map((plan) => (
            <div key={plan.name} style={{
              background: "var(--bg-card)",
              border: plan.highlight ? "2px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: "40px 32px",
              position: "relative",
              boxShadow: plan.highlight ? "0 8px 32px rgba(22, 163, 74, 0.12)" : "var(--shadow-sm)",
            }}>
              {plan.highlight && (
                <div style={{
                  position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                  background: "var(--accent)", color: "white", padding: "4px 16px",
                  borderRadius: "999px", fontSize: "12px", fontWeight: 700,
                }}>Most Popular</div>
              )}
              <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>{plan.name}</h3>
              <div style={{ marginBottom: "32px" }}>
                <span style={{ fontSize: "48px", fontWeight: 700, letterSpacing: "-0.03em" }}>{plan.price}</span>
                <span style={{ fontSize: "16px", color: "var(--text-secondary)" }}>{plan.period}</span>
              </div>
              <ul style={{ listStyle: "none", marginBottom: "32px" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{
                    padding: "8px 0", fontSize: "14px", color: "var(--text-secondary)",
                    display: "flex", alignItems: "center", gap: "10px",
                  }}>
                    <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup" className={`btn ${plan.highlight ? "btn-primary" : "btn-secondary"}`} style={{ width: "100%" }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        padding: "80px 48px 40px",
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
      }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "48px", marginBottom: "64px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <div style={{
                  width: "32px", height: "32px", background: "var(--accent)",
                  borderRadius: "8px", display: "flex", alignItems: "center",
                  justifyContent: "center", color: "white", fontWeight: 700, fontSize: "16px",
                }}>H</div>
                <span style={{ fontSize: "18px", fontWeight: 700 }}>HireAHuman</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", maxWidth: "300px", lineHeight: 1.7 }}>
                The open-source platform where AI agents hire humans for tasks, verification, and creative work.
              </p>
            </div>
            {[
              { title: "Product", links: ["Features", "Pricing", "Docs", "Changelog"] },
              { title: "Resources", links: ["GitHub", "Discord", "Blog", "Examples"] },
              { title: "Company", links: ["About", "Contact", "Careers", "Press"] },
              { title: "Legal", links: ["Privacy", "Terms", "License", "Security"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-primary)", marginBottom: "20px" }}>{col.title}</h4>
                {col.links.map((link) => (
                  <a key={link} href="#" style={{
                    display: "block", padding: "6px 0", fontSize: "14px",
                    color: "var(--text-secondary)", transition: "color 200ms",
                  }}>{link}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{
            borderTop: "1px solid var(--border)", paddingTop: "24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>© 2026 HireAHuman. Open source under MIT License.</p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Built with ❤️ by the open-source community</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
