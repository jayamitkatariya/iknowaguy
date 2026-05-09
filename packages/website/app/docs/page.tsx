import Link from 'next/link';

export default function DocsPage() {
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
            <Link href="/download">Download</Link>
            <Link href="/" className="btn-nav">Get Started</Link>
          </div>
        </div>
      </nav>

      <section className="docs-hero">
        <div className="container">
          <h1>Documentation</h1>
          <p className="hero-description">
            Everything you need to integrate iknowaguy with your AI agents.
          </p>
        </div>
      </section>

      <section className="docs-nav">
        <div className="container">
          <div className="docs-grid">
            <aside className="docs-sidebar">
              <div className="docs-sidebar-section">
                <h4>Getting Started</h4>
                <ul>
                  <li><a href="#installation">Installation</a></li>
                  <li><a href="#quickstart">Quick Start</a></li>
                  <li><a href="#configuration">Configuration</a></li>
                </ul>
              </div>
              <div className="docs-sidebar-section">
                <h4>Reference</h4>
                <ul>
                  <li><a href="#mcp-tools">MCP Tools</a></li>
                  <li><a href="#cli-commands">CLI Commands</a></li>
                  <li><a href="#examples">Examples</a></li>
                </ul>
              </div>
            </aside>

            <div className="docs-content">
              <h1>Welcome to iknowaguy</h1>
              <p className="lead">
                A local-first developer tool that gives AI agents access to human workers 
                via the MCP (Model Context Protocol) server running on your laptop.
              </p>

              <h2 id="installation">Installation</h2>
              <p>
                Install the iknowaguy CLI with a single command. Works on macOS and Linux.
              </p>
              <pre><code>curl -sL https://iknowaguy.dev/install.sh | bash</code></pre>
              <p>Or via npm:</p>
              <pre><code>npm install -g @iknowaguy/cli</code></pre>

              <div className="note">
                <p><strong>Prerequisites:</strong> Node.js 18+ and a Supabase project. 
                You'll need your Supabase URL and service role key.</p>
              </div>

              <h2 id="quickstart">Quick Start</h2>
              
              <h3>1. Initialize</h3>
              <pre><code>iknowaguy init</code></pre>
              <p>
                This registers your tenant with Supabase and stores credentials in 
                <code>~/.iknowaguy/config.json</code>.
              </p>

              <h3>2. Start</h3>
              <pre><code>iknowaguy start</code></pre>
              <p>
                Starts the local API server on port 3001 and MCP server on port 3000.
              </p>

              <h3>3. Connect Your AI Agent</h3>
              <p>Add to your MCP configuration:</p>
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

              <h2 id="configuration">Configuration</h2>
              <p>
                The config file is stored at <code>~/.iknowaguy/config.json</code>:
              </p>
              <pre><code>{`{
  "version": "0.1.0",
  "tenant_id": "uuid",
  "api_key": "hah_xxx",
  "supabase_url": "https://xxx.supabase.co",
  "supabase_service_role_key": "eyJxxx",
  "api_port": 3001,
  "mcp_port": 3000
}`}</code></pre>

              <h2 id="mcp-tools">MCP Tools</h2>
              
              <h3>Discovery</h3>
              <ul>
                <li><code>list_categories</code> — List all available task categories</li>
                <li><code>get_category</code> — Get a specific category by ID or slug</li>
                <li><code>list_humans</code> — Search available human workers with skill/location filters</li>
                <li><code>get_human</code> — Get full profile for a specific human worker</li>
              </ul>

              <h3>Assignment</h3>
              <ul>
                <li><code>request_human</code> — Auto-assign a task to a human by skills or specific ID</li>
                <li><code>create_bounty</code> — Create a new bounty task for the worker pool</li>
                <li><code>list_bounties</code> — List bounties with status, category, and assignee filters</li>
                <li><code>get_bounty</code> — Get full details for a single bounty</li>
                <li><code>accept_bounty</code> — Accept a bounty and assign it to a human worker</li>
                <li><code>submit_bounty</code> — Submit completed work with photos, notes, and evidence</li>
                <li><code>review_bounty</code> — Approve or reject a submitted bounty</li>
              </ul>

              <h3>Communication</h3>
              <ul>
                <li><code>send_message</code> — Send a message in a bounty thread</li>
                <li><code>list_messages</code> — List all messages in a bounty thread</li>
              </ul>

              <h3>Payment</h3>
              <ul>
                <li><code>initiate_payment</code> — Create a Stripe PaymentIntent and hold funds</li>
                <li><code>get_payment_status</code> — Check payment and transaction status for a bounty</li>
                <li><code>release_payment</code> — Capture held funds to pay the worker</li>
                <li><code>refund_payment</code> — Refund held funds back to the payer</li>
              </ul>

              <h3>Resolution</h3>
              <ul>
                <li><code>raise_dispute</code> — Raise a dispute on a bounty with evidence</li>
              </ul>

              <h2 id="cli-commands">CLI Commands</h2>
              <pre><code>{`iknowaguy init      # Register tenant and create config
iknowaguy start    # Start API and MCP server
iknowaguy stop     # Stop background processes
iknowaguy status   # Check if running
iknowaguy update   # Update to latest version`}</code></pre>

              <h2 id="examples">Examples</h2>
              <p>
                Check out the <a href="https://github.com/jayamitkatariya/iknowaguy">GitHub repository</a> for 
                example implementations with different AI agents.
              </p>
            </div>
          </div>
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
