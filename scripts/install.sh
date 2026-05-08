#!/usr/bin/env bash
#
# iknowaguy Install Script
# Usage: curl -fsSL https://install.iknowaguy.ai | bash
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

# ── Config ───────────────────────────────────────────────────────────────────
REPO_URL="https://github.com/jayamitkatariya/iknowaguy.git"
INSTALL_DIR="${HOME}/.iknowaguy"
MIN_NODE_VERSION=18

# ── Helpers ──────────────────────────────────────────────────────────────────
print_banner() {
  echo ""
  echo -e "${CYAN}${BOLD}"
  echo '  ╔═══════════════════════════════════════════════════════════════╗'
  echo '  ║                                                               ║'
  echo '  ║   ██╗  ██╗██╗██████╗ ███████╗ █████╗ ██╗   ██╗███╗   ███╗ █╗  ║'
  echo '  ║   ██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║   ██║████╗ ████║██║  ║'
  echo '  ║   ███████║██║██████╔╝█████╗  ███████║██║   ██║██╔████╔██║██║  ║'
  echo '  ║   ██╔══██║██║██╔══██╗██╔══╝  ██╔══██║██║   ██║██║╚██╔╝██║╚═╝  ║'
  echo '  ║   ██║  ██║██║██║  ██║███████╗██║  ██║╚██████╔╝██║ ╚═╝ ██║██╗  ║'
  echo '  ║   ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ║'
  echo '  ║                                                               ║'
  echo '  ║        Open-source framework for AI agents to bring           ║'
  echo '  ║              humans into the loop                             ║'
  echo '  ║                                                               ║'
  echo '  ╚═══════════════════════════════════════════════════════════════╝'
  echo -e "${RESET}"
}

info() {
  echo -e "${BLUE}ℹ${RESET}  $1"
}

success() {
  echo -e "${GREEN}✔${RESET}  $1"
}

warn() {
  echo -e "${YELLOW}⚠${RESET}  $1"
}

error() {
  echo -e "${RED}✖${RESET}  $1"
}

step() {
  echo ""
  echo -e "${BOLD}${MAGENTA}▶ $1${RESET}"
}

# ── Node.js Version Check ────────────────────────────────────────────────────
check_node() {
  step "Checking prerequisites"

  if ! command -v node >/dev/null 2>&1; then
    error "Node.js is not installed."
    echo ""
    echo -e "   Please install Node.js ${MIN_NODE_VERSION} or later:"
    echo -e "   ${CYAN}https://nodejs.org/${RESET}"
    echo ""
    exit 1
  fi

  NODE_VERSION=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)

  if [ "$NODE_MAJOR" -lt "$MIN_NODE_VERSION" ]; then
    error "Node.js v${NODE_VERSION} is too old."
    echo ""
    echo -e "   iknowaguy requires Node.js >= ${MIN_NODE_VERSION}."
    echo -e "   Please upgrade: ${CYAN}https://nodejs.org/${RESET}"
    echo ""
    exit 1
  fi

  success "Node.js v${NODE_VERSION}"

  if ! command -v npm >/dev/null 2>&1; then
    error "npm is not installed."
    echo ""
    echo -e "   npm usually comes with Node.js. Please reinstall Node.js."
    echo ""
    exit 1
  fi

  NPM_VERSION=$(npm -v)
  success "npm v${NPM_VERSION}"
}

# ── Clone or Update ──────────────────────────────────────────────────────────
clone_or_pull() {
  step "Installing iknowaguy to ${INSTALL_DIR}"

  if [ -d "$INSTALL_DIR/.git" ]; then
    info "Existing installation found. Updating..."
    git -C "$INSTALL_DIR" pull --ff-only
  else
    info "Cloning repository..."
    if [ -d "$INSTALL_DIR" ]; then
      warn "Directory exists but is not a git repo. Backing up..."
      mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.$(date +%s)"
    fi
    git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  fi

  success "Repository ready at ${INSTALL_DIR}"
}

# ── Install Dependencies ─────────────────────────────────────────────────────
install_deps() {
  step "Installing dependencies"
  cd "$INSTALL_DIR"
  npm install
  success "Dependencies installed"
}

# ── Build ────────────────────────────────────────────────────────────────────
build_project() {
  step "Building project"
  cd "$INSTALL_DIR"
  npm run build
  success "Build complete"
}

# ── PATH Setup ───────────────────────────────────────────────────────────────
setup_path() {
  step "Setting up PATH"

  BIN_PATH="${INSTALL_DIR}/packages/cli/bin"

  # Check if already in PATH
  case ":${PATH}:" in
    *:"${BIN_PATH}":*)
      success "${BIN_PATH} is already in your PATH"
      return
      ;;
  esac

  # Determine shell config file
  SHELL_NAME=$(basename "${SHELL:-bash}")
  case "$SHELL_NAME" in
    zsh)
      SHELL_CONFIG="${HOME}/.zshrc"
      ;;
    bash)
      if [ -f "${HOME}/.bashrc" ]; then
        SHELL_CONFIG="${HOME}/.bashrc"
      else
        SHELL_CONFIG="${HOME}/.bash_profile"
      fi
      ;;
    fish)
      SHELL_CONFIG="${HOME}/.config/fish/config.fish"
      ;;
    *)
      SHELL_CONFIG="${HOME}/.${SHELL_NAME}rc"
      ;;
  esac

  echo ""
  echo -e "   To use the ${BOLD}iknowaguy${RESET} command, add this to your PATH:"
  echo ""
  echo -e "   ${CYAN}export PATH=\"${BIN_PATH}:\$PATH\"${RESET}"
  echo ""

  if [ -t 0 ] && [ -t 1 ]; then
    read -r -p "   Would you like to add this to ${SHELL_CONFIG}? (y/N) " response
    if [[ "$response" =~ ^[Yy]$ ]]; then
      mkdir -p "$(dirname "$SHELL_CONFIG")"
      echo "" >> "$SHELL_CONFIG"
      echo "# iknowaguy CLI" >> "$SHELL_CONFIG"
      echo "export PATH=\"${BIN_PATH}:\$PATH\"" >> "$SHELL_CONFIG"
      success "Added to ${SHELL_CONFIG}"
      warn "Run ${BOLD}source ${SHELL_CONFIG}${RESET} or open a new terminal to use iknowaguy"
    else
      info "Skipping PATH modification. Run the export command above manually."
    fi
  else
    info "Non-interactive shell detected. Add the export line above to your shell config."
  fi
}

# ── Success Message ──────────────────────────────────────────────────────────
print_success() {
  echo ""
  echo -e "${GREEN}${BOLD}"
  echo '  ╔═══════════════════════════════════════════════════════════════╗'
  echo '  ║                     INSTALL COMPLETE!                         ║'
  echo '  ╚═══════════════════════════════════════════════════════════════╝'
  echo -e "${RESET}"
  echo -e "  ${BOLD}Next Steps:${RESET}"
  echo ""
  echo -e "  1. ${BOLD}Initialize your project:${RESET}"
  echo -e "     ${CYAN}iknowaguy init${RESET}"
  echo ""
  echo -e "  2. ${BOLD}Start all servers:${RESET}"
  echo -e "     ${CYAN}iknowaguy dev${RESET}"
  echo ""
  echo -e "  3. ${BOLD}Run the setup wizard:${RESET}"
  echo -e "     ${CYAN}iknowaguy setup:agent${RESET}"
  echo ""
  echo -e "  ${DIM}Docs:    https://docs.iknowaguy.ai${RESET}"
  echo -e "  ${DIM}GitHub:  https://github.com/jayamitkatariya/iknowaguy${RESET}"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────────────────────
main() {
  print_banner
  check_node
  clone_or_pull
  install_deps
  build_project
  setup_path
  print_success
}

main "$@"
