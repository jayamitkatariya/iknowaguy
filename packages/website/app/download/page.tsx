import Link from 'next/link';

export default function DownloadPage() {
  return (
    <>
      <nav>
        <div className="container">
          <div className="logo">
            <div className="logo-icon">⚡</div>
            iknowaguy
          </div>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/docs">Docs</Link>
            <Link href="/" className="btn-nav">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="docs-hero">
        <div className="container">
          <h1>Download & Install</h1>
          <p className="hero-description">
            Get the iknowaguy CLI running on your machine in under a minute.
          </p>
        </div>
      </section>

      <section className="docs-nav">
        <div className="container">
          <div className="download-grid">
            <div className="download-card">
              <div className="icon">🖥️</div>
              <h3>macOS / Linux</h3>
              <p>The fastest way to get started. Run the install script.</p>
              <div className="code">curl -sL https://iknowaguy.dev/install.sh | bash</div>
            </div>
            <div className="download-card">
              <div className="icon">📦</div>
              <h3>via npm</h3>
              <p>Install globally with npm or pnpm.</p>
              <div className="code">npm install -g @iknowaguy/cli</div>
            </div>
            <div className="download-card">
              <div className="icon">🔧</div>
              <h3>Manual Install</h3>
              <p>Download from GitHub releases and symlink manually.</p>
              <div className="code">https://github.com/jayamitkatariya/iknowaguy/releases</div>
            </div>
            <div className="download-card">
              <div className="icon">🐳</div>
              <h3>Docker</h3>
              <p>Run the full stack with Docker Compose.</p>
              <div className="code">docker-compose up -d</div>
            </div>
          </div>
        </div>
      </section>

      <section className="download-section">
        <div className="container-narrow">
          <h2>Quick Start</h2>
          <p>After installation, initialize and start the servers.</p>
          <pre><code>{`# Initialize (registers your tenant)
iknowaguy init

# Start the API and MCP server
iknowaguy start

# Check status
iknowaguy status`}</code></pre>
        </div>
      </section>

      <section className="download-section">
        <div className="container-narrow">
          <h2>Connect Your AI Agent</h2>
          <p>
            Add iknowaguy to your MCP configuration file. The location varies by agent:
          </p>
          <pre><code>{`{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["-y", "@iknowaguy/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}`}</code></pre>
        </div>
      </section>

      <section className="download-section">
        <div className="container-narrow">
          <h2>Verify Installation</h2>
          <p>Check that everything is installed correctly:</p>
          <pre><code>{`iknowaguy --version
iknowaguy status`}</code></pre>
        </div>
      </section>

      <section className="cta">
        <div className="container-narrow">
          <h2>Need help?</h2>
          <p>
            Check the documentation for detailed setup instructions and troubleshooting.
          </p>
          <Link href="/docs" className="btn btn-primary">
            Read the Docs
          </Link>
        </div>
      </section>

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
