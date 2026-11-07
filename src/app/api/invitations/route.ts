import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore, type ExtendedInvitationRecord } from "@/lib/local-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizePhone, sanitizeText, sanitizeUpi, sanitizeUrl } from "@/lib/sanitize";

function slugPart(value: unknown) {
  return String(value || "")
    .trim()
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

type PostInvitationBody = {
  eventType?: string;
  firstName?: string;
  secondName?: string | null;
  age?: string | null;
  date?: string;
  time?: string;
  venue?: string;
  address?: string | null;
  maps?: string | null;
  message?: string | null;
  contact?: string | null;
  template?: string;
  plan?: string;
  coverPhotoUrl?: string | null;
  galleryUrls?: string[];
  events?: Array<{ name: string; date: string; time: string; venue: string; address?: string }>;
  dressCode?: string | null;
  travelInfo?: string | null;
  musicUrl?: string | null;
  shagunUpi?: string | null;
  registryUrl?: string | null;
  layoutType?: string | null;
};

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`invitations-create:${ip}`, {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 15,                  // Max 15 creations
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many invitations created recently. Please wait before creating more." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  let body: PostInvitationBody;
  try {
    body = (await request.json()) as PostInvitationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: rateLimit.headers });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400, headers: rateLimit.headers });
  }

  if (JSON.stringify(body).length > 2000000) {
    return NextResponse.json({ error: "Invitation data is too large." }, { status: 413, headers: rateLimit.headers });
  }

  const rawFirstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
  const rawDate = typeof body.date === "string" ? body.date.trim() : "";
  const rawTime = typeof body.time === "string" ? body.time.trim() : "";
  const rawVenue = typeof body.venue === "string" ? body.venue.trim() : "";

  if (!rawFirstName || !rawDate || !rawTime || !rawVenue) {
    return NextResponse.json(
      { error: "Name, date, time and venue are required." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  // Date boundary restriction: cannot be > 90 days in past or > 5 years in future
  const parsedDate = new Date(rawDate);
  const minDate = new Date(Date.now() - 90 * 86400000);
  const maxDate = new Date(Date.now() + 5 * 365 * 86400000);
  if (isNaN(parsedDate.getTime()) || parsedDate < minDate || parsedDate > maxDate) {
    return NextResponse.json(
      { error: "Event date must be a valid celebration date within the next 5 years." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  if (rawFirstName.length > 80 || String(body.secondName || "").length > 80 || String(body.message || "").length > 2000) {
    return NextResponse.json(
      { error: "Some invitation fields are too long (name max 80 chars, message max 2000 chars)." },
      { status: 400, headers: rateLimit.headers }
    );
  }

  // Plan and Layout restriction
  const rawPlan = String(body.plan || "starter").toLowerCase().trim();
  const plan = ["starter", "signature", "keepsake"].includes(rawPlan) ? rawPlan : "starter";

  const rawLayout = String(body.layoutType || "classic").toLowerCase().trim();
  const layoutType = ["classic", "cinematic", "cartoon", "royalscroll", "magazine"].includes(rawLayout)
    ? rawLayout
    : "classic";

  // Sanitize all text fields
  const firstName = sanitizeText(rawFirstName, 80);
  const secondName = body.secondName ? sanitizeText(body.secondName, 80) : null;
  const age = body.age ? sanitizeText(body.age, 20) : null;
  const date = sanitizeText(rawDate, 30);
  const time = sanitizeText(rawTime, 30);
  const venue = sanitizeText(rawVenue, 150);
  const eventType = sanitizeText(body.eventType || "Wedding", 50);
  const address = sanitizeText(body.address || "", 300);
  const message = sanitizeText(body.message || "", 1500);
  const template = sanitizeText(body.template || "Elegant Gold", 50);
  const dressCode = body.dressCode ? sanitizeText(body.dressCode, 100) : null;
  const travelInfo = body.travelInfo ? sanitizeText(body.travelInfo, 500) : null;

  // Sanitize URLs, UPI, Phone
  const maps = sanitizeUrl(body.maps);
  const coverPhotoUrl = sanitizeUrl(body.coverPhotoUrl);
  const musicUrl = sanitizeUrl(body.musicUrl);
  const registryUrl = sanitizeUrl(body.registryUrl);
  const shagunUpi = sanitizeUpi(body.shagunUpi);
  const contact = sanitizePhone(body.contact);

  const galleryUrls = Array.isArray(body.galleryUrls)
    ? body.galleryUrls
        .map((u) => sanitizeUrl(u))
        .filter((u): u is string => Boolean(u))
        .slice(0, 20)
    : [];

  const events = Array.isArray(body.events)
    ? body.events.slice(0, 10).map((ev) => ({
        name: sanitizeText(ev?.name, 80),
        date: sanitizeText(ev?.date, 30),
        time: sanitizeText(ev?.time, 30),
        venue: sanitizeText(ev?.venue, 150),
        address: sanitizeText(ev?.address, 200),
      }))
    : [];

  const rawPrefix = [slugPart(firstName), slugPart(secondName || age)].filter(Boolean).join("-") || "invitation";
  const RESERVED_SLUGS = new Set([
    "admin", "api", "auth", "login", "logout", "dashboard", "create", "invite",
    "demo", "terms", "privacy", "settings", "static", "pricing", "faq", "contact"
  ]);
  const prefix = RESERVED_SLUGS.has(rawPrefix) ? `celebrate-${rawPrefix}` : rawPrefix;
  const slug = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  const days = plan === "keepsake" ? 30 : plan === "signature" ? 7 : 3;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    // Local / Demo Mode fallback when Supabase is not configured
    const record = {
      id: crypto.randomUUID(),
      owner_id: "local-user",
      slug,
      event_type: eventType,
      first_name: firstName,
      second_name: secondName,
      age,
      date,
      time,
      venue,
      address,
      maps,
      message,
      contact,
      template,
      plan,
      cover_photo_url: coverPhotoUrl,
      gallery_urls: galleryUrls,
      events,
      dress_code: dressCode,
      travel_info: travelInfo,
      music_url: musicUrl,
      shagun_upi: shagunUpi,
      registry_url: registryUrl,
      layout_type: layoutType,
      expires_at: expiresAt,
      views: 0,
      created_at: new Date().toISOString(),
    };
    localStore.saveInvitation(record);
    return NextResponse.json({ id: record.id, slug: record.slug }, { headers: rateLimit.headers });
  }

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const ownerId = user?.id || null;

  const fullPayload: Record<string, unknown> = {
    owner_id: ownerId,
    slug,
    event_type: eventType,
    first_name: firstName,
    second_name: secondName,
    age,
    date,
    time,
    venue,
    address,
    maps,
    message,
    contact,
    template,
    plan,
    cover_photo_url: coverPhotoUrl,
    gallery_urls: galleryUrls,
    events,
    dress_code: dressCode,
    travel_info: travelInfo,
    music_url: musicUrl,
    shagun_upi: shagunUpi,
    registry_url: registryUrl,
    layout_type: layoutType,
    expires_at: expiresAt,
  };

  const payloadToInsert: Record<string, unknown> = { ...fullPayload };
  let insertRes = await supabase.from("invitations").insert(payloadToInsert).select("id, slug").single();

  let attempts = 0;
  while (insertRes.error && (insertRes.error.code === "PGRST204" || insertRes.error.code === "42703") && attempts < 10) {
    attempts++;
    const missingColMatch = insertRes.error.message.match(/Could not find the '([^']+)' column/i);
    if (missingColMatch && missingColMatch[1] && missingColMatch[1] in payloadToInsert) {
      delete payloadToInsert[missingColMatch[1]];
      insertRes = await supabase.from("invitations").insert(payloadToInsert).select("id, slug").single();
    } else {
      const coreKeys = ["slug", "event_type", "first_name", "second_name", "age", "date", "time", "venue", "address", "maps", "message", "template", "plan", "expires_at"];
      Object.keys(payloadToInsert).forEach((k) => {
        if (!coreKeys.includes(k)) delete payloadToInsert[k];
      });
      insertRes = await supabase.from("invitations").insert(payloadToInsert).select("id, slug").single();
      break;
    }
  }

  const { data, error } = insertRes;

  if (error || !data) {
    const fallbackRecord = {
      id: crypto.randomUUID(),
      owner_id: ownerId || "local-user",
      created_at: new Date().toISOString(),
      views: 0,
      ...fullPayload,
    };
    localStore.saveInvitation(fallbackRecord as unknown as ExtendedInvitationRecord);
    return NextResponse.json({ id: fallbackRecord.id, slug }, { headers: rateLimit.headers });
  }

  const localRecord = {
    id: data.id,
    created_at: new Date().toISOString(),
    views: 0,
    ...fullPayload,
    owner_id: ownerId || "local-user",
  };
  localStore.saveInvitation(localRecord as unknown as ExtendedInvitationRecord);

  return NextResponse.json({ id: data.id, slug: data.slug }, { headers: rateLimit.headers });
}
