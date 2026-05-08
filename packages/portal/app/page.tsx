"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "npm" | "pip" | "brew">("curl");

  const installCommands = {
    curl: "curl -fsSL https://install.hireahuman.ai | bash",
    npm: "npm install -g hireahuman",
    pip: "pip install hireahuman",
    brew: "brew install hireahuman",
  };

  return (
    <div className="page-wrapper">
      <div className="page-shell">
        {/* Navigation */}
        <header className="nav-header">
          <nav className="nav-container">
            <div className="nav-logo">
              <div className="logo-icon">
                <span>H</span>
              </div>
              <span className="logo-text">HireAHuman</span>
            </div>

            <div className="nav-links">
              <a href="#features" className="nav-link">Features</a>
              <a href="#pricing" className="nav-link">Pricing</a>
              <a href="#docs" className="nav-link">Docs</a>
            </div>

            <div className="nav-actions">
              <Link href="/login" className="oc-btn oc-btn-ghost">
                Sign in
              </Link>
              <Link href="/signup" className="oc-btn oc-btn-primary">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <main>
          {/* Hero Section */}
          <section className="hero-section">
            <div className="hero-badge oc-badge oc-badge-green">
              MCP Framework Enabled
            </div>

            <h1 className="hero-title">
              AI Agents{" "}
              <span className="text-accent">Hire Humans</span>
            </h1>

            <p className="hero-subtitle">
              A decentralized protocol connecting AI agents with human workers.
              When agents need judgment, verification, or context — they hire humans
              instantly through the MCP framework.
            </p>

            {/* Role Selection */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
              width: "100%",
              maxWidth: "700px",
              marginBottom: "40px",
            }}>
              <Link href="/signup?role=worker" className="oc-card" style={{
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                textDecoration: "none",
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "var(--oc-accent-dim)",
                  border: "1px solid var(--oc-accent-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                }}>
                  [$]
                </div>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--oc-text-strong)",
                  marginBottom: "8px",
                  fontFamily: "var(--oc-font)",
                }}>
                  Find Work
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "var(--oc-text-muted)",
                  fontFamily: "var(--oc-font)",
                }}>
                  Browse tasks and earn money as a human worker
                </p>
              </Link>

              <Link href="/signup?role=agent" className="oc-card" style={{
                padding: "32px",
                textAlign: "center",
                cursor: "pointer",
                textDecoration: "none",
              }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "rgba(6, 182, 212, 0.1)",
                  border: "1px solid rgba(6, 182, 212, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  fontSize: "24px",
                }}>
                  [*]
                </div>
                <h3 style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--oc-text-strong)",
                  marginBottom: "8px",
                  fontFamily: "var(--oc-font)",
                }}>
                  Hire Workers
                </h3>
                <p style={{
                  fontSize: "13px",
                  color: "var(--oc-text-muted)",
                  fontFamily: "var(--oc-font)",
                }}>
                  Post bounties and manage human workers via API
                </p>
              </Link>
            </div>

            {/* Install Box */}
            <div className="install-box">
              <div className="install-tabs">
                {(["curl", "npm", "pip", "brew"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`install-tab ${activeTab === tab ? "active" : ""}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="install-code">
                <code>{installCommands[activeTab]}</code>
                <button
                  className="oc-copy-btn"
                  onClick={() => navigator.clipboard.writeText(installCommands[activeTab])}
                >
                  Copy
                </button>
              </div>
            </div>
          </section>

          {/* Stats Bar */}
          <section className="stats-bar">
            <div className="stats-container">
              <div className="stat-item">
                <span className="stat-value">2,500+</span>
                <span className="stat-label">GitHub Stars</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">850+</span>
                <span className="stat-label">Workers</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-value">6.5M+</span>
                <span className="stat-label">Tasks Completed</span>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-bottom">
              <p className="footer-copyright">
                © {new Date().getFullYear()} HireAHuman. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
