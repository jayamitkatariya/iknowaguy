import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import crypto from "crypto";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `hak_live_${crypto.randomBytes(24).toString("hex")}`;
  const hash = hashApiKey(raw);
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || record.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count++;
  return true;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_REGEX = /^[a-z0-9-]+$/;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action, email, name, slug } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    if (!supabaseUrl || !serviceKey || !anonKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "generate_key") {
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      if (user.email !== email) {
        return NextResponse.json({ error: "Email does not match authenticated user" }, { status: 403 });
      }

      const { raw, hash, prefix } = generateApiKey();

      const res = await fetch(`${supabaseUrl}/rest/v1/tenants?contact_email=eq.${encodeURIComponent(email)}&limit=1`, {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Failed to look up tenant" }, { status: 500 });
      }

      const tenants = await res.json();

      if (!tenants || tenants.length === 0) {
        return NextResponse.json({ error: "No tenant found for this email" }, { status: 404 });
      }

      const updateRes = await fetch(`${supabaseUrl}/rest/v1/tenants?id=eq.${tenants[0].id}`, {
        method: "PATCH",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          api_key_hash: hash,
          api_key_prefix: prefix,
        }),
      });

      if (!updateRes.ok) {
        return NextResponse.json({ error: "Failed to update API key" }, { status: 500 });
      }

      return NextResponse.json({
        api_key: raw,
        api_key_prefix: prefix,
        message: "API key generated successfully",
      });
    }

    if (action === "register") {
      if (!name || typeof name !== "string" || name.length < 1 || name.length > 100) {
        return NextResponse.json({ error: "Name is required (1-100 characters)" }, { status: 400 });
      }
      if (!slug || typeof slug !== "string" || slug.length < 1 || slug.length > 50 || !SLUG_REGEX.test(slug)) {
        return NextResponse.json({ error: "Slug must be 1-50 characters, lowercase alphanumeric and hyphens only" }, { status: 400 });
      }
      if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: "Valid email required" }, { status: 400 });
      }
      if (user.email !== email) {
        return NextResponse.json({ error: "Email does not match authenticated user" }, { status: 403 });
      }

      const { raw, hash, prefix } = generateApiKey();

      const createRes = await fetch(`${supabaseUrl}/rest/v1/tenants`, {
        method: "POST",
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({
          name,
          slug,
          api_key_hash: hash,
          api_key_prefix: prefix,
          contact_email: email,
          is_active: true,
          payment_enabled: false,
          payment_provider: null,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        return NextResponse.json({ error: err.message || "Failed to create tenant" }, { status: 500 });
      }

      const [tenant] = await createRes.json();

      return NextResponse.json({
        tenant,
        api_key: raw,
        message: "Account created successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
