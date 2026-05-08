#!/usr/bin/env bash
#
# iknowaguy Publish Script
# Publishes the CLI package to npm and tags the release
#

set -euo pipefail

# ── ANSI Colors ──────────────────────────────────────────────────────────────
BOLD='\033[1m'
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
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI_PACKAGE="$ROOT_DIR/packages/cli"

# ── Pre-flight checks ────────────────────────────────────────────────────────
step "Pre-flight checks"

if ! command -v npm >/dev/null 2>&1; then
  error "npm is not installed"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  error "git is not installed"
  exit 1
fi

# Check if logged in to npm
if ! npm whoami >/dev/null 2>&1; then
  error "You are not logged in to npm."
  echo ""
  echo -e "   Run ${CYAN}npm login${RESET} first."
  echo ""
  exit 1
fi

success "Logged in as $(npm whoami)"

# Check working tree is clean
if [ -n "$(git -C "$ROOT_DIR" status --porcelain)" ]; then
  warn "Working tree is not clean. Uncommitted changes detected."
  read -r -p "   Continue anyway? (y/N) " response
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Get version from package.json
VERSION=$(node -p "require('$CLI_PACKAGE/package.json').version")
info "Publishing version: ${BOLD}$VERSION${RESET}"

# Check if tag already exists
if git -C "$ROOT_DIR" rev-parse "v$VERSION" >/dev/null 2>&1; then
  error "Tag v$VERSION already exists"
  exit 1
fi

# ── Build all packages ───────────────────────────────────────────────────────
step "Building all packages"
cd "$ROOT_DIR"
npm run build
success "All packages built"

# ── Run tests if available ───────────────────────────────────────────────────
if npm run test --silent >/dev/null 2>&1; then
  step "Running tests"
  npm run test
  success "Tests passed"
else
  info "No test script found, skipping"
fi

# ── Publish CLI to npm ───────────────────────────────────────────────────────
step "Publishing @iknowaguy/cli to npm"
cd "$CLI_PACKAGE"

# Determine tag: pre-release gets 'next', stable gets 'latest'
if [[ "$VERSION" =~ -(alpha|beta|rc|pre) ]]; then
  TAG="next"
  warn "Pre-release detected. Publishing with tag: ${TAG}"
else
  TAG="latest"
  info "Stable release. Publishing with tag: ${TAG}"
fi

npm publish --access public --tag "$TAG"
success "Published @iknowaguy/cli@$VERSION with tag '$TAG'"

# ── Tag the release ──────────────────────────────────────────────────────────
step "Tagging release"
cd "$ROOT_DIR"
git tag -a "v$VERSION" -m "Release v$VERSION"
success "Created git tag v$VERSION"

echo ""
echo -e "${GREEN}${BOLD}Publish complete!${RESET}"
echo ""
echo -e "  Package: ${CYAN}@iknowaguy/cli@$VERSION${RESET}"
echo -e "  Tag:     ${CYAN}$TAG${RESET}"
echo -e "  Git tag: ${CYAN}v$VERSION${RESET}"
echo ""
echo -e "  To push the tag to remote:"
echo -e "  ${CYAN}git push origin v$VERSION${RESET}"
echo ""
