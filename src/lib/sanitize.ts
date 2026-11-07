/**
 * Input sanitization and XSS prevention utilities.
 * Ensures all user-supplied data (URLs, text, phone numbers, UPI identifiers)
 * are validated, stripped of dangerous payloads, and safe for rendering or storage.
 */

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates and sanitizes a URL to prevent JavaScript execution (XSS via javascript: or data: URIs).
 * Only returns valid http or https URLs.
 */
export function sanitizeUrl(rawUrl: unknown, fallback: string | null = null): string | null {
  if (typeof rawUrl !== "string") return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  // Immediately reject dangerous pseudo-protocols even before parsing
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:")
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(trimmed);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return parsed.toString();
    }
    return fallback;
  } catch {
    // Relative URLs starting with / (excluding // which is protocol-relative)
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
      return trimmed;
    }
    return fallback;
  }
}

/**
 * Validates a UPI ID format (e.g. name@okhdfcbank, user@upi).
 * Prevents command/parameter injection into upi://, gpay://, phonepe:// intents.
 */
export function sanitizeUpi(rawUpi: unknown): string | null {
  if (typeof rawUpi !== "string") return null;
  const trimmed = rawUpi.trim();
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z0-9]{2,64}$/;
  if (upiRegex.test(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Strips script tags, HTML tags, control characters, and enforces length limits.
 */
export function sanitizeText(rawText: unknown, maxLength = 1000): string {
  if (typeof rawText !== "string") return "";
  let text = rawText
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Strip non-printable control chars
    .trim();

  if (maxLength > 0 && text.length > maxLength) {
    text = text.slice(0, maxLength);
  }
  return text;
}

/**
 * Sanitizes slug strings to ensure only safe URL-friendly characters: [a-z0-9-]
 */
export function sanitizeSlug(rawSlug: unknown): string {
  return String(rawSlug || "")
    .trim()
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 100);
}

/**
 * Extracts clean numeric digits for phone numbers, retaining optional leading plus.
 */
export function sanitizePhone(rawPhone: unknown): string {
  if (typeof rawPhone !== "string") return "";
  const trimmed = rawPhone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}
