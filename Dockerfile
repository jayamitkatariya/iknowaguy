# ── Multi-stage Dockerfile for HireAHuman MCP Server ─────────────────────────
# Stage 1: Build
# Stage 2: Production runtime

# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1: BUILD
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22 AS builder

WORKDIR /app

# Copy root package files for workspace install
COPY package*.json ./
COPY packages/mcp-server/package*.json ./packages/mcp-server/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies (workspaces + root)
RUN npm install -ws

# Copy source code
COPY packages/mcp-server/ ./packages/mcp-server/
COPY packages/shared/ ./packages/shared/
COPY tsconfig.json ./

# Build the MCP server and its workspace dependencies
RUN cd packages/shared && npm run build
RUN cd packages/mcp-server && npm run build

# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2: RUNTIME
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22-slim AS runner

WORKDIR /app

# Install minimal dependencies for native modules if needed
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy built artifacts and production node_modules from builder
COPY --from=builder /app/packages/mcp-server/dist ./packages/mcp-server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/mcp-server/package*.json ./packages/mcp-server/
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/package*.json ./

# Reinstall production dependencies only
RUN npm install -ws --production && npm cache clean --force

# Expose ports used by the HireAHuman stack
# 3001: MCP HTTP Server
# 3002: Worker App
# 3003: Admin Dashboard
EXPOSE 3001 3002 3003

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Run the MCP HTTP server
CMD ["node", "packages/mcp-server/dist/index-http.js"]
