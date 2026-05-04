# HireAHuman — Complete Build Plan

## Vision
Open-source, MCP-first platform for AI agents to hire real humans. Two modes:
1. **Internal** — Team human-in-the-loop. Agent routes tasks to team members via notifications (Slack, Telegram, email, SMS).
2. **External** — Public bounty marketplace. Agent posts bounties, workers browse/claim/complete, get paid.

## Architecture
```
AI Agent (Hermes/OpenClaw/Claude/Any MCP-compatible)
    │
    │ MCP over HTTP (port 3001)
    ▼
┌─────────────────────┐
│  MCP Server         │  ← packages/mcp-server (TypeScript, Express, MCP SDK)
│  16 tools           │     JSON-RPC 2.0 over HTTP
└──────────┬──────────┘
           │ Supabase Client
           ▼
┌─────────────────────┐
│  Supabase           │  ← Cloud PostgreSQL
│  (Database)         │     Multi-tenant, RLS, Auth, Storage, Real-time
└──────────┬──────────┘
    ┌──────┴──────┐
    ▼             ▼
Worker App    Admin Dashboard
(port 3002)   (port 3003)
```

## Tech Stack
- **Runtime:** Node.js 22+
- **Package Manager:** npm (NOT pnpm — causes module resolution issues)
- **Monorepo:** Turborepo
- **MCP Server:** Express + @modelcontextprotocol/sdk + Zod
- **Database:** Supabase (cloud PostgreSQL)
- **Frontend:** Next.js 14.2.5 (NOT 15 — no `use(params)`)
- **Styling:** Inline CSS + globals.css (NO Tailwind — SWC CSS bug in this workspace)
- **Payments:** Stripe
- **Notifications:** Slack webhooks, Telegram Bot API, Email (nodemailer), SMS (Twilio)

## Critical Constraints
- Next.js 14.2.5 only — `use(params)` is NOT supported
- No Tailwind CSS — SWC parsing bug
- No pnpm — use npm
- Supabase singleton client: `import { supabase } from "@/lib/supabase"` — never call createClient() again
- CSS import ONLY in root layout.tsx (Server Component)
- All inline styles for components, classes in globals.css only

## Current State (7,800 LOC)
- MCP server: dual implementation (index-http.ts monolith + modular tools/*.ts) — NEEDS CONSOLIDATION
- Worker App: pages exist but half features fake (hardcoded stats, object URLs for uploads)
- Admin Dashboard: settings don't persist, team invite is stub
- Payments: Stripe adapter exists in shared/ but never wired into API routes or MCP tools
- Notifications: 4 real adapters (email, slack, telegram, sms)
- Database: production-grade schema with RLS
- Security: plaintext API keys, no CSRF, in-memory rate limiter
- Tests: zero

## Phase Plan

### Phase 1: Foundation
- [ ] Delete index-http.ts monolith, consolidate on modular tools/*.ts
- [ ] Make modular MCP server the HTTP entry point (add Express HTTP transport to index.ts)
- [ ] Fix auth middleware to set `app.current_tenant_id` for RLS
- [ ] Add Zod validation to all tool handlers
- [ ] Clean up dead code (orphaned types.ts schemas, unused components)

### Phase 2: Payments
- [ ] Wire Stripe adapter from shared/payments into MCP tools
- [ ] Implement escrow flow: create_intent → capture on approval → refund on rejection
- [ ] Wire Stripe into API payment routes
- [ ] Worker payout via Stripe Connect or Transfer
- [ ] Payment status tracking in payment_transactions table

### Phase 3: File Storage
- [ ] Configure Supabase Storage bucket for evidence
- [ ] Create upload API endpoint (signed URLs)
- [ ] Worker app: real photo upload to Supabase Storage
- [ ] Evidence display in admin dashboard review flow
- [ ] Media URL validation in MCP tools

### Phase 4: MCP Server Completion
- [ ] All 16 tools production-grade with proper error handling
- [ ] Webhook/notification callbacks on status changes
- [ ] Real-time subscriptions for bounty updates
- [ ] Pagination with cursors (not just offset)
- [ ] Request ID tracking
- [ ] Structured logging

### Phase 5: Worker App
- [ ] Complete auth flow (signup, login, session management)
- [ ] Real stats computation (earnings, tasks completed, rating)
- [ ] Responsive/mobile-first CSS
- [ ] Real-time bounty updates (Supabase subscriptions)
- [ ] Evidence upload with preview
- [ ] Worker profile with skills, location, availability
- [ ] Notification preferences
- [ ] Earnings/payment history page

### Phase 6: Admin Dashboard
- [ ] Settings persistence to Supabase
- [ ] Real team invite flow (email invitation)
- [ ] Bounty review with evidence viewer
- [ ] Analytics dashboard (bounties by status, category, worker performance)
- [ ] Worker management (verify, suspend, rate)
- [ ] Payment management (view transactions, refunds)

### Phase 7: Security
- [ ] Hash API keys (SHA-256)
- [ ] CSRF protection
- [ ] Redis rate limiter (replace in-memory)
- [ ] Input sanitization in all handlers
- [ ] crypto.randomBytes for completion codes
- [ ] Environment validation at startup
- [ ] CORS configuration for production domains

### Phase 8: Landing Page
- [ ] Marketing homepage (what it is, how it works, pricing)
- [ ] Documentation site (MCP tool reference, getting started, examples)
- [ ] Open source page (GitHub link, contributing guide)

### Phase 9: Testing
- [ ] Integration tests for MCP tool lifecycle
- [ ] API route tests
- [ ] E2E bounty flow test
- [ ] Build verification (turbo build passes)

### Phase 10: Final Review
- [ ] Code audit
- [ ] Documentation completeness
- [ ] Ship checklist
- [ ] Gap analysis
