# Publish @iknowaguy/cli to npm

## Prerequisites

- npm account with access to the `@iknowaguy` scope
- 2FA enabled (required for scoped packages)

## Steps

### Option A: Using OTP (one-time code)

```bash
cd packages/cli
pnpm build
npm publish --access public --otp=YOUR_6_DIGIT_CODE
```

Your OTP comes from your authenticator app (Google Authenticator, Authy, 1Password, etc.) — look for the npm/npmjs entry.

### Option B: Using an automation token (recommended, no OTP needed)

1. Go to https://www.npmjs.com/settings/jayamitkatariya/tokens/granular-access-tokens/new
2. Fill in:
   - **Token name:** `opencode-publish`
   - **Expiration:** 90 days
   - **Packages and scopes:** Read and write, scope `@iknowaguy`, select `cli`
   - **Type:** Automation (this bypasses 2FA)
3. Click "Generate Token" and copy it
4. Run:

```bash
export NPM_TOKEN=npm_xx...xxxx
cd packages/cli
pnpm build
npm publish --access public
```

## After Publishing

Users can install instantly:

```bash
npm install -g @iknowaguy/cli
```

Then initialize:

```bash
iknowaguy init
iknowaguy start
```

## Verify it worked

```bash
npm view @iknowaguy/cli
```

Should show version and the package details.

## Local-First Architecture

The CLI package includes:
- `iknowaguy` command (init, start, stop, status, update)
- API server (port 3001)
- MCP server (port 3000)

When users run `iknowaguy start`, both servers run locally on their laptop. Supabase is the only cloud dependency.