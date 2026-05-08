#!/bin/bash
# iknowaguy MCP Server Installer
# Usage: curl -sL https://raw.githubusercontent.com/iknowaguy/iknowaguy/main/scripts/install.sh | bash

set -e

REPO="jayamitkatariya/iknowaguy"
RELEASE_URL="https://github.com/$REPO/releases/download/v0.1.0"
TARBALL="iknowaguy-mcp-server-0.1.0.tgz"
INSTALL_DIR="${HOME}/.iknowaguy/mcp-server"

echo "📦 Installing iknowaguy MCP Server..."
echo "   Release: https://github.com/$REPO/releases/tag/v0.1.0"

# Create install dir
mkdir -p "$INSTALL_DIR"

# Download tarball
echo "⬇️  Downloading MCP server..."
curl -sL "${RELEASE_URL}/${TARBALL}" -o "/tmp/${TARBALL}"

# Extract
echo "📂 Extracting..."
tar -xzf "/tmp/${TARBALL}" -C "$INSTALL_DIR"

# Verify
if [ -f "$INSTALL_DIR/package.json" ]; then
    echo "✅ iknowaguy MCP Server installed to $INSTALL_DIR"
    echo ""
    echo "To use with Claude/Cline, add to your MCP config:"
    echo '  { "mcpServers": { "iknowaguy": { "command": "node", "args": ["'"$INSTALL_DIR"'/dist/index.js"] } } }'
    echo ""
    echo "Or install globally: npm install -g $INSTALL_DIR"
else
    echo "❌ Installation failed — tarball may be corrupt"
    exit 1
fi

# Cleanup
rm -f "/tmp/${TARBALL}"