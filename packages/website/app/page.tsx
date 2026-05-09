import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <nav>
        <div className="container">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            iknowaguy
          </div>
          <div className="nav-links">
            <Link href="/docs">Docs</Link>
            <Link href="/download">Download</Link>
            <Link href="/download" className="btn-nav">Get Started</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="dot"></span>
              Now supporting 17 MCP tools
            </div>
            <h1>
              Give your AI agents<br />
              <span className="gradient">access to human workers</span>
            </h1>
            <p className="hero-description">
              Local-first developer tool that connects AI agents like Hermes, Claude, 
              and Cline to real humans via MCP server — running on your laptop.
            </p>
            <div className="install-command">
              <span className="prompt">$</span>
              curl -sL https://iknowaguy.dev/install.sh | bash
              <span className="copy-icon">📋</span>
            </div>
            <div className="hero-buttons">
              <Link href="/download" className="btn btn-primary">
                Download CLI
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                Read the Docs
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">17</div>
                <div className="hero-stat-label">MCP Tools</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">Local</div>
                <div className="hero-stat-label">First</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">MIT</div>
                <div className="hero-stat-label">License</div>
              </div>
            </div>
          </div>
        </section>

        <section className="how-it-works">
          <div className="container">
            <div className="section-header">
              <span className="section-label">How it works</span>
              <h2 className="section-title">Up and running in 30 seconds</h2>
              <p className="section-description">
                No complex setup. No server infrastructure. Just install, init, and start.
              </p>
            </div>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Install</h3>
                <p>
                  Run the install script once. It creates ~/.iknowaguy/ with the CLI 
                  and MCP server, no complex configuration needed.
                </p>
                <div className="step-terminal">
                  <span className="cmd">curl</span> -sL iknowaguy.dev/install.sh | bash
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Initialize</h3>
                <p>
                  Run iknowaguy init to register your tenant and get API credentials 
                  stored securely in ~/.iknowaguy/config.json.
                </p>
                <div className="step-terminal">
                  <span className="cmd">iknowaguy</span> init
                </div>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Start</h3>
                <p>
                  Launch the local API on port 3001 and MCP server on port 3000. 
                  Your AI agent can now access human workers.
                </p>
                <div className="step-terminal">
                  <span className="cmd">iknowaguy</span> start
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mcp-tools">
          <div className="container">
            <div className="section-header">
              <span className="section-label">MCP Tools</span>
              <h2 className="section-title">17 tools for human-in-the-loop</h2>
              <p className="section-description">
                Your AI agent connects via MCP and can create bounties, 
                assign tasks, message workers, and handle payments.
              </p>
            </div>
            <div className="tools-grid">
              <div className="tool-item">
                <span className="category">Discovery</span>
                list_categories
              </div>
              <div className="tool-item">
                <span className="category">Discovery</span>
                get_category
              </div>
              <div className="tool-item">
                <span className="category">Discovery</span>
                list_humans
              </div>
              <div className="tool-item">
                <span className="category">Discovery</span>
                get_human
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                request_human
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                create_bounty
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                list_bounties
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                get_bounty
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                accept_bounty
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                submit_bounty
              </div>
              <div className="tool-item">
                <span className="category">Assignment</span>
                review_bounty
              </div>
              <div className="tool-item">
                <span className="category">Communication</span>
                send_message
              </div>
              <div className="tool-item">
                <span className="category">Communication</span>
                list_messages
              </div>
              <div className="tool-item">
                <span className="category">Resolution</span>
                raise_dispute
              </div>
              <div className="tool-item">
                <span className="category">Payment</span>
                initiate_payment
              </div>
              <div className="tool-item">
                <span className="category">Payment</span>
                get_payment_status
              </div>
              <div className="tool-item">
                <span className="category">Payment</span>
                release_payment
              </div>
            </div>
            <div className="tools-cta">
              <p>Works with any MCP-compatible AI agent</p>
              <Link href="/docs" className="btn btn-primary">
                View Full Documentation
              </Link>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <div className="section-header">
              <span className="section-label">Features</span>
              <h2 className="section-title">Built for developers</h2>
              <p className="section-description">
                Simple, local-first design with zero infrastructure dependencies.
              </p>
            </div>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">🔒</div>
                <h3>Local-First</h3>
                <p>
                  Everything runs locally on your machine. API server and MCP server 
                  start with a single command, no cloud services required.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔌</div>
                <h3>MCP Compatible</h3>
                <p>
                  Works with any MCP-compatible AI agent including Hermes, Claude, 
                  Cline, and OpenCode via the standard MCP protocol.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">💳</div>
                <h3>Built-in Payments</h3>
                <p>
                  Stripe integration for secure payment holds, releases, and refunds. 
                  Handle payments directly through MCP tools.
                </p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛠️</div>
                <h3>17 Tools</h3>
                <p>
                  Complete set of tools for discovery, assignment, communication, 
                  payment, and dispute resolution.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="cta">
          <div className="container-narrow">
            <h2>Get started today</h2>
            <p>
              No sign-up required. No server infrastructure. Supabase is the only 
              cloud dependency, and it handles itself.
            </p>
            <div className="install-command">
              <span className="prompt">$</span>
              curl -sL https://iknowaguy.dev/install.sh | bash
              <span className="copy-icon">📋</span>
            </div>
            <div className="hero-buttons">
              <Link href="/download" className="btn btn-primary">
                Download CLI
              </Link>
              <Link href="/docs" className="btn btn-secondary">
                Read the Docs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <div className="footer-left">
            <div className="footer-logo">⚡ iknowaguy</div>
            <div className="footer-links">
              <Link href="/docs">Documentation</Link>
              <Link href="/download">Download</Link>
              <a href="https://github.com/jayamitkatariya/iknowaguy" target="_blank" rel="noopener noreferrer">GitHub</a>
            </div>
          </div>
          <div className="footer-right">
            MIT License © 2026
          </div>
        </div>
      </footer>
    </>
  );
}
