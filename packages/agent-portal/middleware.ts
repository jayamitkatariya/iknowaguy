import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — no auth required
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Protected routes — check iknowaguy API auth
  const apiKey = request.cookies.get("hah_api_key")?.value
    || request.cookies.get("hah_token")?.value;

  // For client-side storage, we can't check here easily since Next.js middleware
  // can't read localStorage. Use a cookie set by the login page.
  if (!apiKey) {
    // Check Authorization header pattern for API routes
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer hah_")) {
      return NextResponse.next();
    }

    // No token found — redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
