import Link from 'next/link';

export default function DownloadPage() {
  return (
    <>
      <nav>
        <div className="container">
          <div className="logo">iknowaguy</div>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/docs">Docs</Link>
          </div>
        </div>
      </nav>

      <section className="download-hero">
        <div className="container">
          <h1>Download iknowaguy</h1>
          <p>Install the CLI and get started in under a minute.</p>
        </div>
      </section>

      <section className="container" style={{ padding: '48px 0' }}>
        <div className="download-section">
          <h2>macOS / Linux</h2>
          <p>Run the install script to download and set up the CLI:</p>
          <div className="download-cmd">curl -sL https://get.iknowaguy.ai/install.sh | bash</div>
        </div>

        <div className="download-section">
          <h2>via npm</h2>
          <p>Install globally with npm:</p>
          <pre className="code-block">npm install -g @iknowaguy/cli</pre>
        </div>

        <div className="download-section">
          <h2>Manual Download</h2>
          <p>Download the latest release from GitHub:</p>
          <pre className="code-block">https://github.com/jayamitkatariya/iknowaguy/releases/latest</pre>
          <p>Extract the tarball and symlink the bin:</p>
          <pre className="code-block">{`tar -xzf iknowaguy-cli-*.tgz -C ~/.iknowaguy/cli/
ln -s ~/.iknowaguy/cli/bin/iknowaguy /usr/local/bin/iknowaguy`}</pre>
        </div>

        <div className="download-section">
          <h2>Quick Start</h2>
          <p>After installation, initialize and start:</p>
          <pre className="code-block">{`# Initialize (register your tenant)
iknowaguy init

# Start the API and MCP server
iknowaguy start

# Check status
iknowaguy status`}</pre>
        </div>

        <div className="download-section">
          <h2>Verify Installation</h2>
          <p>Check the installed version:</p>
          <pre className="code-block">iknowaguy --version</pre>
        </div>
      </section>

      <footer>
        <div className="container">
          <p>© 2026 iknowaguy — Open source, MIT license</p>
        </div>
      </footer>
    </>
  );
}