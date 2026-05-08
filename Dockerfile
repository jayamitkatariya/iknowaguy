# ── Multi-stage Dockerfile for HireAHuman MCP Server ─────────────────────────
# Stage 1: Build
# Stage 2: Production runtime

# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1: BUILD
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

# Copy root package files for pnpm workspace
COPY package*.json pnpm-workspace.yaml ./
COPY packages/mcp-server/package*.json ./packages/mcp-server/
COPY packages/shared/package*.json ./packages/shared/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/mcp-server/ ./packages/mcp-server/
COPY packages/shared/ ./packages/shared/
COPY turbo.json tsconfig.json ./

# Build shared first, then mcp-server
RUN pnpm build --filter=@hireahuman/shared
RUN pnpm build --filter=@hireahuman/mcp-server

# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2: RUNTIME
# ═══════════════════════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

# Copy built artifacts and package files
COPY --from=builder /app/packages/mcp-server/dist ./packages/mcp-server/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/mcp-server/package*.json ./packages/mcp-server/
COPY --from=builder /app/packages/shared/package*.json ./packages/shared/
COPY --from=builder /app/package*.json pnpm-workspace.yaml ./

# Reinstall production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Expose MCP server port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Run the unified MCP server (supports --stdio and HTTP modes)
CMD ["node", "packages/mcp-server/dist/index.js"]
