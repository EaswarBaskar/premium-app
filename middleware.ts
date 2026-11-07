import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithNext(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", destination);
  return NextResponse.redirect(loginUrl);
}

function hasAdminCredentials(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get("traxva_admin_session")?.value;
  const authHeader = request.headers.get("authorization");
  const headerPasscode = request.headers.get("x-admin-passcode")?.trim();

  // Reject immediately if no credentials are provided
  if (!sessionCookie && !authHeader && !headerPasscode) {
    return false;
  }

  // Verify structure: <base36-timestamp>.<32-char hex nonce>.<64-char hex hmac>
  if (sessionCookie) {
    const parts = sessionCookie.split(".");
    if (parts.length === 3 && parts[0].length >= 4 && parts[1].length === 32 && parts[2].length === 64) {
      return true;
    }
  }

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const parts = token.split(".");
    if (parts.length === 3 && parts[0].length >= 4 && parts[1].length === 32 && parts[2].length === 64) {
      return true;
    }
  }

  if (headerPasscode && headerPasscode.length >= 6) {
    return true;
  }

  return false;
}

function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  res.headers.set("X-XSS-Protection", "1; mode=block");
  return res;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  // 1. Cross-Origin Mutation Restriction (CSRF Protection for API routes)
  if (
    pathname.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(request.method)
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host && !originUrl.host.includes("localhost") && !originUrl.host.includes("127.0.0.1")) {
          return applySecurityHeaders(
            NextResponse.json(
              { error: "Forbidden: Cross-origin request blocked." },
              { status: 403 }
            )
          );
        }
      } catch {}
    }
  }

  // 2. Admin API Route Protection
  if (pathname.startsWith("/api/admin")) {
    // Public authentication status/login endpoint
    if (pathname !== "/api/admin/auth") {
      if (!hasAdminCredentials(request)) {
        return applySecurityHeaders(
          NextResponse.json(
            { error: "Unauthorized. Administrator authentication required." },
            { status: 401 }
          )
        );
      }
    }
    return applySecurityHeaders(response);
  }

  // 3. Admin Page Lock Protection
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const configuredPasscode = process.env.ADMIN_PASSCODE?.trim();
    if (configuredPasscode && !hasAdminCredentials(request)) {
      // Let the client page render the admin passcode lock screen
    }
  }

  // 4. Supabase Auth Session Refresh & Dashboard Route Protection
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // When Supabase is not configured, allow local demo mode to operate smoothly
    return applySecurityHeaders(response);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") && !user) {
    return applySecurityHeaders(redirectWithNext(request));
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
