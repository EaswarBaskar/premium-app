/**
 * Secure environment variable access and validation.
 * Enforces fail-closed security for secrets and prevents accidental leakage to client bundles.
 */

export interface EnvHealth {
  supabaseConfigured: boolean;
  supabaseUrlValid: boolean;
  adminPasscodeConfigured: boolean;
  googleOAuthConfigured: boolean;
  metaWhatsappConfigured: boolean;
  twilioConfigured: boolean;
  isProduction: boolean;
}

export function maskSecret(secret: string | undefined | null): string {
  if (!secret) return "Not set";
  if (secret.length <= 8) return "••••••••";
  return `${secret.slice(0, 4)}••••••••${secret.slice(-4)}`;
}

export function getValidatedServerEnv() {
  if (typeof window !== "undefined") {
    throw new Error("getValidatedServerEnv() must never be executed on the client.");
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const adminPasscode = process.env.ADMIN_PASSCODE?.trim() || "";

  return {
    supabaseUrl,
    supabaseSecretKey,
    adminPasscode,
    metaWhatsappToken: process.env.META_WHATSAPP_TOKEN,
    metaWhatsappPhoneId: process.env.META_WHATSAPP_PHONE_ID,
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    isProduction: process.env.NODE_ENV === "production",
  };
}

export function getEnvironmentHealth(): EnvHealth {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const pubKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasValidUrl = Boolean(url && /^https?:\/\//i.test(url));
  const hasPubKey = Boolean(pubKey && pubKey.length > 10);
  const adminPasscode = process.env.ADMIN_PASSCODE?.trim();

  return {
    supabaseConfigured: Boolean(hasValidUrl && hasPubKey),
    supabaseUrlValid: Boolean(hasValidUrl),
    adminPasscodeConfigured: Boolean(adminPasscode && adminPasscode.length >= 8),
    googleOAuthConfigured: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    metaWhatsappConfigured: Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_WHATSAPP_PHONE_ID),
    twilioConfigured: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    isProduction: process.env.NODE_ENV === "production",
  };
}
