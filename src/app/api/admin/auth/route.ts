import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getExpectedAdminToken, verifyAdminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const required = Boolean(process.env.ADMIN_PASSCODE?.trim());
  const authenticated = await verifyAdminAuth(request);
  return NextResponse.json({ required, authenticated });
}

export async function POST(request: Request) {
  const expectedPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (!expectedPasscode) {
    return NextResponse.json({ ok: true, message: "No admin passcode configured." });
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const provided = String(body.passcode || "").trim();
  if (provided !== expectedPasscode) {
    return NextResponse.json({ error: "Incorrect admin passcode. Access denied." }, { status: 401 });
  }

  const token = getExpectedAdminToken();
  const cookieStore = await cookies();
  if (token) {
    cookieStore.set("traxva_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return NextResponse.json({ ok: true, token });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("traxva_admin_session");
  return NextResponse.json({ ok: true, message: "Logged out." });
}

