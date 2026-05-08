# Publish @iknowaguy/mcp-server to npm

## Prerequisites

- npm account with access to the `@iknowaguy` scope
- 2FA enabled (required for scoped packages)

## Steps

### Option A: Using OTP (one-time code)

```bash
cd packages/mcp-server
pnpm build
npm publish --access public --otp=YOUR_6_DIGIT_CODE
```

Your OTP comes from your authenticator app (Google Authenticator, Authy, 1Password, etc.) — look for the npm/npmjs entry.

### Option B: Using an automation token (recommended, no OTP needed)

1. Go to https://www.npmjs.com/settings/jayamitkatariya/tokens/granular-access-tokens/new
2. Fill in:
   - **Token name:** `opencode-publish`
   - **Expiration:** 90 days
   - **Packages and scopes:** Read and write, scope `@iknowaguy`, select `mcp-server`
   - **Type:** Automation (this bypasses 2FA)
3. Click "Generate Token" and copy it
4. Run:

```bash
export NPM_TOKEN=npm_xxxxxxxxxxxxxxxxxxxxxxxxxx
cd packages/mcp-server
pnpm build
npm publish --access public
```

## After Publishing

Users can install instantly:

```bash
npx @iknowaguy/mcp-server
```

Or add to AI agent config:

```json
{
  "mcpServers": {
    "iknowaguy": {
      "command": "npx",
      "args": ["@iknowaguy/mcp-server"],
      "env": { "IKNOWAGUY_API_KEY": "ikg_live_your-key" }
    }
  }
}
```

## Verify it worked

```bash
npm view @iknowaguy/mcp-server
```

Should show version `0.1.0` and the package details.
