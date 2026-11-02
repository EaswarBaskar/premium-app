import { cookies } from "next/headers";
import crypto from "crypto";

export function getExpectedAdminToken(): string | null {
  const passcode = process.env.ADMIN_PASSCODE?.trim();
  if (!passcode) return null;
  return crypto.createHash("sha256").update(passcode).digest("hex");
}

export async function verifyAdminAuth(request?: Request): Promise<boolean> {
  const expected = getExpectedAdminToken();
  if (!expected) return true; // No passcode configured, open access

  // 1. Check request headers
  if (request) {
    const headerPasscode = request.headers.get("x-admin-passcode")?.trim();
    if (headerPasscode && process.env.ADMIN_PASSCODE && headerPasscode === process.env.ADMIN_PASSCODE.trim()) {
      return true;
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token === expected) return true;
    }
  }

  // 2. Check cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("traxva_admin_session")?.value;
    if (sessionCookie && sessionCookie === expected) return true;
  } catch {}

  return false;
}

