import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name, slug, action } = body;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const endpoint = action === "register" ? "/auth/register" : "/auth/login";
    const payload = action === "register"
      ? { name, slug, email, password }
      : { email, password };

    // Call the external iknowaguy API
    const res = await fetch(`${apiUrl}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error || "Authentication failed" },
        { status: res.status }
      );
    }

    const apiKey = data.data?.api_key;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No API key returned" },
        { status: 500 }
      );
    }

    // Set cookie and redirect to dashboard
    const redirectUrl = new URL("/dashboard", req.url);

    const response = NextResponse.redirect(redirectUrl, { status: 302 });
    response.cookies.set("hah_api_key", apiKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    response.cookies.set("hah_tenant_id", data.data?.tenant?.id || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    response.cookies.set("hah_tenant_name", data.data?.tenant?.name || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}
