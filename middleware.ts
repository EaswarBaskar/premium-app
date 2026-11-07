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
  if (sessionCookie && sessionCookie.split(".").length === 3) {
    return true;
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ") && authHeader.slice(7).trim().split(".").length === 3) {
    return true;
  }
  const headerPasscode = request.headers.get("x-admin-passcode")?.trim();
  if (headerPasscode && headerPasscode.length >= 6) {
    return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  // 1. Admin API Route Protection
  if (pathname.startsWith("/api/admin")) {
    // Public authentication routes (login, status, logout)
    if (pathname !== "/api/admin/auth") {
      if (!hasAdminCredentials(request)) {
        return NextResponse.json(
          { error: "Unauthorized. Administrator authentication required." },
          { status: 401 }
        );
      }
    }
    return response;
  }

  // 2. Supabase Auth Session Refresh & Dashboard Route Protection
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // When Supabase is not configured, allow local demo mode to operate smoothly
    return response;
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

  const { data: { user } } = await supabase.auth.getUser();
  if (pathname.startsWith("/dashboard") && !user) {
    return redirectWithNext(request);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/rsvps/:path*", "/api/admin/:path*"],
};
