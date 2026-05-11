FROM node:22-alpine AS base
WORKDIR /app

FROM base AS builder
RUN npm install -g pnpm@10
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/platform/package.json packages/platform/
RUN pnpm install --frozen-lockfile
COPY packages/platform packages/platform
WORKDIR /app/packages/platform
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/packages/platform/.next/standalone ./
COPY --from=builder /app/packages/platform/.next/static ./.next/static
COPY --from=builder /app/packages/platform/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
