#!/bin/bash
# iknowaguy CLI Installer
# Usage: curl -sL https://website-ochre-sigma-97.vercel.app/install.sh | bash
# Or:    npm install -g @iknowaguy/cli

set -e

REPO="jayamitkatariya/iknowaguy"
LATEST_VERSION=$(curl -sL https://api.github.com/repos/$REPO/releases/latest | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)
LATEST_VERSION=${LATEST_VERSION:-v0.2.0}
RELEASE_URL="https://github.com/$REPO/releases/download/$LATEST_VERSION"
TARBALL="iknowaguy-cli-${LATEST_VERSION}.tgz"
INSTALL_DIR="${HOME}/.iknowaguy/cli"
BIN_SOURCE="${INSTALL_DIR}/bin/iknowaguy.js"
BIN_LINK="${HOME}/.local/bin/iknowaguy"

echo "📦 Installing iknowaguy CLI..."
echo "   Version: $LATEST_VERSION"
echo "   Release: https://github.com/$REPO/releases/tag/$LATEST_VERSION"

# Create install dir
mkdir -p "$INSTALL_DIR"

# Download tarball
echo "⬇️  Downloading CLI..."
curl -sL "${RELEASE_URL}/${TARBALL}" -o "/tmp/${TARBALL}"

# Extract
echo "📂 Extracting..."
tar -xzf "/tmp/${TARBALL}" -C "$INSTALL_DIR"

# Verify
if [ -f "$BIN_SOURCE" ]; then
    echo "✅ iknowaguy CLI installed to $INSTALL_DIR"
    echo ""
    
    # Create bin symlink
    mkdir -p "$(dirname "$BIN_LINK")"
    if ln -sf "$BIN_SOURCE" "$BIN_LINK" 2>/dev/null; then
        echo "✅ Symlinked to $BIN_LINK"
    else
        echo "📝 Add to PATH: export PATH=\"\$HOME/.local/bin:\$PATH\""
        echo "   Or run directly: node $BIN_SOURCE"
    fi
    
    echo ""
    echo "Next steps:"
    echo "  1. iknowaguy init     # Register your tenant"
    echo "  2. iknowaguy start    # Start API + MCP server"
    echo "  3. iknowaguy status   # Verify it's running"
else
    echo "❌ Installation failed — tarball may be corrupt or missing files"
    echo "   Expected: $BIN_SOURCE"
    exit 1
fi

# Cleanup
rm -f "/tmp/${TARBALL}"