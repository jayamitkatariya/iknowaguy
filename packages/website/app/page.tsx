import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <nav>
        <div className="container">
          <div className="logo">iknowaguy</div>
          <div className="nav-links">
            <Link href="/docs">Docs</Link>
            <Link href="/download">Download</Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="hero">
          <div className="container">
            <h1>Give your AI agents<br />access to human workers</h1>
            <p>
              Local-first developer tool that gives AI agents (Hermes, Claude, Cline, OpenCode) 
              access to real humans via MCP server running on your laptop.
            </p>
            <div className="install-cmd">curl -sL https://get.iknowaguy.ai/install.sh | bash</div>
            <div>
              <Link href="/download" className="btn btn-primary">Download CLI</Link>
              <Link href="/docs" className="btn btn-secondary" style={{ marginLeft: '12px' }}>Read Docs</Link>
            </div>
          </div>
        </section>

        <section className="features">
          <div className="container">
            <h2>How it works</h2>
            <div className="features-grid">
              <div className="feature-card">
                <h3>1. Install</h3>
                <p>Run the install script once. Creates ~/.iknowaguy/ with the CLI and MCP server.</p>
              </div>
              <div className="feature-card">
                <h3>2. Init</h3>
                <p>Run iknowaguy init to register your tenant and get API credentials stored locally.</p>
              </div>
              <div className="feature-card">
                <h3>3. Start</h3>
                <p>Run iknowaguy start to launch the local API (port 3001) and MCP server (port 3000).</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mcp-tools">
          <div className="container">
            <h2>17 MCP Tools</h2>
            <div className="tools-grid">
              <div className="tool-item">list_categories</div>
              <div className="tool-item">get_category</div>
              <div className="tool-item">list_humans</div>
              <div className="tool-item">get_human</div>
              <div className="tool-item">request_human</div>
              <div className="tool-item">create_bounty</div>
              <div className="tool-item">list_bounties</div>
              <div className="tool-item">get_bounty</div>
              <div className="tool-item">accept_bounty</div>
              <div className="tool-item">submit_bounty</div>
              <div className="tool-item">review_bounty</div>
              <div className="tool-item">send_message</div>
              <div className="tool-item">list_messages</div>
              <div className="tool-item">raise_dispute</div>
              <div className="tool-item">initiate_payment</div>
              <div className="tool-item">get_payment_status</div>
              <div className="tool-item">release_payment</div>
              <div className="tool-item">refund_payment</div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '24px', color: '#666' }}>
              Your AI agent connects via MCP and can create bounties, assign tasks, and pay workers.
            </p>
          </div>
        </section>

        <section className="cta">
          <div className="container">
            <h2>Get started in 30 seconds</h2>
            <p>No server infrastructure. Supabase is the only cloud dependency.</p>
            <pre className="code-block" style={{ display: 'inline-block', background: '#333', color: '#fff' }}>
              curl -sL https://get.iknowaguy.ai/install.sh | bash
            </pre>
            <br />
            <Link href="/docs" className="btn">Read the Docs</Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <p>© 2026 iknowaguy — Open source, MIT license</p>
        </div>
      </footer>
    </>
  );
}