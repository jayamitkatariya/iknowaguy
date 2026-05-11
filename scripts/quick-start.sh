#!/usr/bin/env bash
# iknowaguy Quick Start
# One-command setup: install → init → start

set -euo pipefail

BOLD='\033[1m'
GREEN='\033[32m'
CYAN='\033[36m'
RESET='\033[0m'

echo -e "${CYAN}${BOLD}"
echo '  iknowaguy Quick Start'
echo -e "${RESET}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "\n${BOLD}Step 1: Install${RESET}"
if [ -x "${SCRIPT_DIR}/install.sh" ]; then
  bash "${SCRIPT_DIR}/install.sh"
else
  echo "install.sh not found. Run: curl -fsSL https://iknowaguy.com/install.sh | bash"
  exit 1
fi

echo -e "\n${BOLD}Step 2: Initialize${RESET}"
iknowaguy init --email "${1:-user@example.com}" --password "${2:-password123}" --name "My Workspace"

echo -e "\n${BOLD}Step 3: Start MCP proxy${RESET}"
iknowaguy start

echo -e "\n${GREEN}Done! Your AI agent can now connect to iknowaguy.${RESET}"
echo "Add this to your MCP config:"
echo -e "${CYAN}  {\"mcpServers\":{\"iknowaguy\":{\"command\":\"iknowaguy\",\"args\":[\"start\"]}}}${RESET}"
