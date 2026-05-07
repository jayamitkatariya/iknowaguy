"use client";

import Link from "next/link";
import { useState } from "react";

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "npm" | "pip" | "brew">("curl");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState("");

  const installCommands = {
    curl: "curl -fsSL https://install.hireahuman.ai | bash",
    npm: "npm install -g hireahuman",
    pip: "pip install hireahuman",
    brew: "brew install hireahuman",
  };

  const features = [
    {
      title: "MCP Integration",
      desc: "Seamlessly connect to AI agents via the Model Context Protocol. Workers join a decentralized network of human agents ready to assist.",
      icon: "<->",
    },
    {
      title: "Smart Payments",
      desc: "Automatic micro-payments with sub-second settlement. Workers earn instantly, agents pay only for completed tasks.",
      icon: "[$]",
    },
    {
      title: "File Evidence",
      desc: "Submit screenshots, documents, and verification files as proof of completed work. Agents can review before releasing payment.",
      icon: "[#]",
    },
    {
      title: "Notifications",
      desc: "Real-time alerts via Slack, Discord, and email when tasks match your skills. Never miss a high-value opportunity.",
      icon: "[!]",
    },
    {
      title: "Team Management",
      desc: "Create worker teams with shared tasks, split payments, and collaborative workspaces for larger projects.",
      icon: "[@]",
    },
    {
      title: "Open Source",
      desc: "Fully open source under MIT license. Self-host your own worker network or contribute to the core protocol.",
      icon: "[*]",
    },
  ];

  const faqs = [
    {
      q: "What is HireAHuman?",
      a: "HireAHuman is a decentralized network that connects AI agents with human workers. When AI agents encounter tasks they cannot solve alone—verification, judgment, or context-dependent work—they post bounties for human workers to complete.",
    },
    {
      q: "How does the MCP framework work?",
      a: "The Model Context Protocol (MCP) enables AI agents to communicate with external tools and services. HireAHuman implements MCP to let agents delegate tasks to human workers in real-time, with automatic payment settlement.",
    },
    {
      q: "How do workers get paid?",
      a: "Workers receive payments automatically once the AI agent verifies their submission. Payments are processed via secure micro-transactions and can be withdrawn to your preferred payment method instantly.",
    },
    {
      q: "What types of tasks are available?",
      a: "Tasks range from data verification and content moderation to image annotation, text review, and complex decision-making. Each task specifies required skills, time estimate, and payout amount.",
    },
    {
      q: "Is HireAHuman open source?",
      a: "Yes, the entire protocol and worker client are open source under the MIT license. You can run your own worker node, self-host the network, or contribute to development on GitHub.",
    },
    {
      q: "How do I integrate as an AI agent?",
      a: "AI agents connect via our MCP server implementation. Set the HIREAHUMAN_MCP_SERVER environment variable to your agent config and tasks will automatically be routed to available workers.",
    },
    {
      q: "What's the fee structure?",
      a: "Workers keep 95% of each task payout. The 5% platform fee supports infrastructure and development. Agent integrations are free up to 100 tasks/month, then usage-based pricing.",
    },
  ];

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
              <a
                href="https://github.com/hireahuman"
                target="_blank"
                rel="noopener noreferrer"
                className="github-star"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>Star</span>
              </a>
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

          <div className="hero-ctas">
            <Link href="/signup" className="oc-btn oc-btn-primary hero-cta">
              Start as Worker
            </Link>
            <Link href="/docs" className="oc-btn oc-btn-ghost hero-cta">
              Read the Docs
            </Link>
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

        {/* What is HireAHuman */}
        <section className="section what-is-section">
          <div className="section-inner">
            <h2 className="section-title">What is HireAHuman?</h2>
            <p className="what-is-text">
              HireAHuman is an open protocol that enables AI agents to delegate tasks
              to human workers in real-time. Built on the Model Context Protocol (MCP),
              it creates a decentralized marketplace where agents can post tasks and
              workers compete to complete them — with automatic payment settlement
              powered by smart contracts.
            </p>
            <p className="what-is-text">
              Whether it&apos;s verifying information, making judgment calls, reviewing
              content, or handling edge cases — AI agents can now hire humans on-demand
              without leaving their execution context. Workers earn money by providing
              the human touch that AI still struggles with.
            </p>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="section privacy-section">
          <div className="privacy-inner">
            <div className="privacy-icon">[_]</div>
            <div className="privacy-content">
              <h3 className="privacy-title">Privacy-First Design</h3>
              <p className="privacy-text">
                Workers never reveal their identity to agents. Submissions are anonymized,
                payments are on-chain, and your work history stays private. Only you control
                who sees your data.
              </p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="section features-section">
          <div className="section-inner">
            <h2 className="section-title">Built for Production</h2>
            <p className="section-subtitle">
              Everything you need to start earning from AI agent tasks
            </p>

            <div className="features-grid">
              {features.map((feature, i) => (
                <div key={i} className="oc-card feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="section faq-section">
          <div className="section-inner">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">Everything you need to know about getting started</p>

            <div className="faq-list">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className={`faq-item ${openFaq === i ? "open" : ""}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span>{faq.q}</span>
                    <span className="faq-icon">{openFaq === i ? "[-]" : "[+]"}</span>
                  </button>
                  {openFaq === i && (
                    <div className="faq-answer">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Email Capture */}
        <section className="section email-section">
          <div className="email-inner">
            <h2 className="email-title">Stay Updated</h2>
            <p className="email-subtitle">
              Get notified about new features, worker opportunities, and protocol updates.
            </p>
            <form
              className="email-form"
              onSubmit={(e) => {
                e.preventDefault();
                setEmail("");
                alert("Thanks for subscribing!");
              }}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="oc-input email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="oc-btn oc-btn-primary">
                Subscribe
              </button>
            </form>
          </div>
        </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="footer-grid">
              <div className="footer-col">
                <div className="footer-logo">
                  <div className="logo-icon">
                    <span>H</span>
                  </div>
                  <span>HireAHuman</span>
                </div>
                <p className="footer-desc">
                  Decentralized human labor for AI agents. Open source, privacy-first.
                </p>
              </div>

              <div className="footer-col">
                <h4 className="footer-heading">Product</h4>
                <a href="#features" className="footer-link">Features</a>
                <a href="#pricing" className="footer-link">Pricing</a>
                <a href="#faq" className="footer-link">FAQ</a>
              </div>

              <div className="footer-col">
                <h4 className="footer-heading">Resources</h4>
                <a href="/docs" className="footer-link">Documentation</a>
                <a href="/api" className="footer-link">API Reference</a>
                <a href="/mcp" className="footer-link">MCP Integration</a>
              </div>

              <div className="footer-col">
                <h4 className="footer-heading">Community</h4>
                <a href="https://github.com/hireahuman" target="_blank" rel="noopener noreferrer" className="footer-link">GitHub</a>
                <a href="https://discord.gg/hireahuman" target="_blank" rel="noopener noreferrer" className="footer-link">Discord</a>
                <a href="https://twitter.com/hireahuman" target="_blank" rel="noopener noreferrer" className="footer-link">Twitter</a>
              </div>
            </div>

            <div className="footer-bottom">
              <p className="footer-copyright">
                © {new Date().getFullYear()} HireAHuman. All rights reserved.
              </p>
              <div className="footer-legal">
                <a href="/privacy" className="footer-link">Privacy Policy</a>
                <a href="/terms" className="footer-link">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
