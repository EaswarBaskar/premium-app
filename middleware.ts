import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectWithNext(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  loginUrl.searchParams.set("next", destination);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
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

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (items) => {
          items.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return redirectWithNext(request);
  }
  return response;
}

export const config = { matcher: ["/dashboard/:path*", "/api/rsvps/:path*"] };
