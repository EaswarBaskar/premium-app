import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_SALT = "traxva_superadmin_secure_v2";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Derives a cryptographically strong signing key from the admin passcode.
 */
function getDerivedKey(): Buffer | null {
  const passcode = process.env.ADMIN_PASSCODE?.trim();
  if (!passcode) return null;
  return crypto.pbkdf2Sync(passcode, SESSION_SALT, 10000, 32, "sha256");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Prevent timing leak on length differences by doing a dummy comparison
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Creates a signed, expiring admin session token.
 * Format: `<timestamp>.<nonce>.<hmac>`
 */
export function createAdminSessionToken(): string | null {
  const key = getDerivedKey();
  if (!key) return null;

  const timestamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${timestamp}.${nonce}`;

  const hmac = crypto
    .createHmac("sha256", key)
    .update(payload)
    .digest("hex");

  return `${payload}.${hmac}`;
}

/**
 * Validates a signed admin session token:
 * 1. Verifies HMAC signature using constant-time comparison
 * 2. Checks token expiration (24h TTL)
 */
export function verifyAdminSessionToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestampStr, nonce, receivedHmac] = parts;
  const key = getDerivedKey();
  if (!key) return false; // Fail closed if ADMIN_PASSCODE is not set

  // Verify HMAC signature
  const expectedHmac = crypto
    .createHmac("sha256", key)
    .update(`${timestampStr}.${nonce}`)
    .digest("hex");

  if (!safeEqual(receivedHmac, expectedHmac)) {
    return false;
  }

  // Check expiration
  const timestamp = parseInt(timestampStr, 36);
  if (isNaN(timestamp) || Date.now() - timestamp > SESSION_TTL_MS || timestamp > Date.now() + 60000) {
    return false;
  }

  return true;
}

/**
 * Validates admin credentials from request headers or session cookie.
 * FAIL-CLOSED: If ADMIN_PASSCODE is not configured, returns FALSE.
 */
export async function verifyAdminAuth(request?: Request): Promise<boolean> {
  const expectedPasscode = process.env.ADMIN_PASSCODE?.trim();
  if (!expectedPasscode) {
    // FAIL-CLOSED: No passcode configured, strictly block access!
    return false;
  }

  // 1. Check request headers (for programmatic API access)
  if (request) {
    const headerPasscode = request.headers.get("x-admin-passcode")?.trim();
    if (headerPasscode && safeEqual(headerPasscode, expectedPasscode)) {
      return true;
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const bearerToken = authHeader.slice(7).trim();
      if (verifyAdminSessionToken(bearerToken)) {
        return true;
      }
    }
  }

  // 2. Check signed HttpOnly cookie
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("traxva_admin_session")?.value;
    if (sessionCookie && verifyAdminSessionToken(sessionCookie)) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Checks whether the entered passcode matches the configured ADMIN_PASSCODE in constant time.
 */
export function verifyPasscode(inputPasscode: string): boolean {
  const configured = process.env.ADMIN_PASSCODE?.trim();
  if (!configured) return false;
  return safeEqual(inputPasscode.trim(), configured);
}
