#!/usr/bin/env bash
#
# HireAHuman Quick Start Script
# One-command setup: install → init → start → open
#

set -euo pipefail

# ── ANSI Colors ──────────────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'
RED='\033[31m'
GREEN='\033[32m'
YELLOW='\033[33m'
BLUE='\033[34m'
CYAN='\033[36m'
MAGENTA='\033[35m'

info()    { echo -e "${BLUE}ℹ${RESET}  $1"; }
success() { echo -e "${GREEN}✔${RESET}  $1"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $1"; }
error()   { echo -e "${RED}✖${RESET}  $1"; }
step()    { echo ""; echo -e "${BOLD}${MAGENTA}▶ $1${RESET}"; }

# ── Config ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${HOME}/.hireahuman"
BIN_PATH="${INSTALL_DIR}/packages/cli/bin"

# ── Banner ───────────────────────────────────────────────────────────────────
print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}"
  echo '  ╔═══════════════════════════════════════════════════════════════╗'
  echo '  ║                                                               ║'
  echo '  ║           ⚡  HIREAHUMAN QUICK START  ⚡                      ║'
  echo '  ║                                                               ║'
  echo '  ║   Install → Initialize → Start → Open in browser              ║'
  echo '  ║                                                               ║'
  echo '  ╚═══════════════════════════════════════════════════════════════╝'
  echo -e "${RESET}"
}

# ── Open URL cross-platform ──────────────────────────────────────────────────
open_url() {
  local url="$1"
  case "$(uname -s)" in
    Darwin*)  open "$url" ;;
    Linux*)   xdg-open "$url" >/dev/null 2>&1 || true ;;
    CYGWIN*|MINGW*|MSYS*) start "$url" ;;
    *)        info "Please open: $url" ;;
  esac
}

# ── Ensure hireahuman binary is available ────────────────────────────────────
ensure_hireahuman() {
  if command -v hireahuman >/dev/null 2>&1; then
    HIREAHUMAN="hireahuman"
    return
  fi

  if [ -x "${BIN_PATH}/run" ]; then
    HIREAHUMAN="${BIN_PATH}/run"
    info "Using hireahuman from ${BIN_PATH}"
    return
  fi

  error "hireahuman command not found after install"
  echo ""
  echo -e "   Please add ${CYAN}${BIN_PATH}${RESET} to your PATH and try again:"
  echo -e "   ${CYAN}export PATH=\"${BIN_PATH}:\$PATH\"${RESET}"
  echo ""
  exit 1
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  print_banner

  # Step 1: Install
  step "Step 1/4: Installing HireAHuman"
  if [ -x "${SCRIPT_DIR}/install.sh" ]; then
    bash "${SCRIPT_DIR}/install.sh"
  else
    error "install.sh not found at ${SCRIPT_DIR}/install.sh"
    exit 1
  fi

  # Make sure we can find the binary
  ensure_hireahuman

  # Step 2: Initialize
  step "Step 2/4: Initializing project"
  info "Running: hireahuman init"
  echo ""
  cd "$INSTALL_DIR"
  $HIREAHUMAN init

  # Step 3: Start all servers
  step "Step 3/4: Starting all servers"
  info "Running: hireahuman dev"
  echo ""
  echo -e "   ${DIM}Services will start on:${RESET}"
  echo -e "   ${CYAN}MCP HTTP Server${RESET}  → http://localhost:3001/mcp"
  echo -e "   ${CYAN}REST API${RESET}        → http://localhost:3000"
  echo -e "   ${CYAN}Worker App${RESET}       → http://localhost:3002"
  echo -e "   ${CYAN}Admin Dashboard${RESET}  → http://localhost:3003"
  echo ""
  warn "Press Ctrl+C to stop all servers"
  echo ""

  # Open landing page in background
  if [ -f "${INSTALL_DIR}/packages/landing/index.html" ]; then
    sleep 3
    LANDING_URL="file://${INSTALL_DIR}/packages/landing/index.html"
    info "Opening landing page..."
    open_url "$LANDING_URL"
  fi

  # Start dev servers (this blocks until Ctrl+C)
  $HIREAHUMAN dev

  # Step 4: Cleanup (runs after Ctrl+C)
  step "Step 4/4: Shutdown"
  success "All servers stopped. See you next time!"
  echo ""
}

main "$@"
