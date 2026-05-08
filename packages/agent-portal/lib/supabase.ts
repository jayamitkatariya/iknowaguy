import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Server-side client for API routes
export function createServerClient() {
  // This is a placeholder - in production you'd use @supabase/ssr createServerClient
  // For API routes in agent-portal, use the MCP server at http://localhost:3001
  return null;
}

// API URL for agent-portal to communicate with MCP server
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";