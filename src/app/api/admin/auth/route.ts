import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminSessionToken, verifyAdminAuth, verifyPasscode } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const configured = Boolean(process.env.ADMIN_PASSCODE?.trim());
  const authenticated = await verifyAdminAuth(request);
  return NextResponse.json({ configured, authenticated });
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`admin-auth-post:${ip}`, {
    windowMs: 15 * 60 * 1000, // 15 minute window
    max: 5,                   // Max 5 attempts
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes before retrying." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const configuredPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (!configuredPasscode) {
    return NextResponse.json(
      { error: "Administrator authentication is not configured on this server." },
      { status: 503, headers: rateLimit.headers }
    );
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  const provided = String(body.passcode || "");
  if (!verifyPasscode(provided)) {
    return NextResponse.json(
      { error: "Incorrect admin passcode. Access denied." },
      { status: 401, headers: rateLimit.headers }
    );
  }

  const token = createAdminSessionToken();
  if (!token) {
    return NextResponse.json(
      { error: "Failed to generate administrator session." },
      { status: 500, headers: rateLimit.headers }
    );
  }

  const cookieStore = await cookies();
  cookieStore.set("traxva_admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  // Do NOT return the token in JSON to prevent token harvesting
  return NextResponse.json(
    { ok: true, message: "Authentication successful." },
    { headers: rateLimit.headers }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("traxva_admin_session");
  return NextResponse.json({ ok: true, message: "Logged out." });
}
