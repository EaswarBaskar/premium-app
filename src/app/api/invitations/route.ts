import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore, type ExtendedInvitationRecord } from "@/lib/local-store";

function slugPart(value: unknown) {
  return String(value || "").trim().normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
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
  let body: PostInvitationBody;
  try {
    body = (await request.json()) as PostInvitationBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }
  if (JSON.stringify(body).length > 2000000) {
    return NextResponse.json({ error: "Invitation data is too large." }, { status: 413 });
  }
  if (
    typeof body.firstName !== "string" ||
    !body.firstName.trim() ||
    !body.date ||
    !body.time ||
    typeof body.venue !== "string" ||
    !body.venue.trim()
  ) {
    return NextResponse.json({ error: "Name, date, time and venue are required." }, { status: 400 });
  }
  if (
    body.firstName.trim().length > 100 ||
    String(body.secondName || "").length > 100 ||
    String(body.message || "").length > 2000
  ) {
    return NextResponse.json({ error: "Some invitation fields are too long." }, { status: 400 });
  }

  const firstName = body.firstName.trim();
  const date = body.date;
  const time = body.time;
  const venue = body.venue.trim();
  const eventType = body.eventType || "Wedding";

  const prefix = [slugPart(body.firstName), slugPart(body.secondName || body.age)].filter(Boolean).join("-") || "invitation";
  const slug = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  const days = body.plan === "keepsake" ? 30 : body.plan === "signature" ? 7 : 3;
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
      second_name: body.secondName?.trim() || null,
      age: body.age || null,
      date,
      time,
      venue,
      address: body.address?.trim() || "",
      maps: body.maps?.trim() || null,
      message: body.message?.trim() || "",
      contact: body.contact?.trim() || null,
      template: body.template || "Elegant Gold",
      plan: body.plan || "starter",
      cover_photo_url: body.coverPhotoUrl?.trim() || null,
      gallery_urls: Array.isArray(body.galleryUrls) ? body.galleryUrls : [],
      events: Array.isArray(body.events) ? body.events : [],
      dress_code: body.dressCode?.trim() || null,
      travel_info: body.travelInfo?.trim() || null,
      music_url: body.musicUrl?.trim() || null,
      shagun_upi: body.shagunUpi?.trim() || null,
      registry_url: body.registryUrl?.trim() || null,
      layout_type: body.layoutType || "classic",
      expires_at: expiresAt,
      views: 0,
      created_at: new Date().toISOString(),
    };
    localStore.saveInvitation(record);
    return NextResponse.json({ id: record.id, slug: record.slug });
  }

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  const ownerId = user?.id || null;

  const fullPayload: Record<string, unknown> = {
    owner_id: ownerId,
    slug,
    event_type: eventType,
    first_name: firstName,
    second_name: body.secondName?.trim() || null,
    age: body.age || null,
    date,
    time,
    venue,
    address: body.address?.trim() || "",
    maps: body.maps?.trim() || null,
    message: body.message?.trim() || "",
    contact: body.contact?.trim() || null,
    template: body.template || "Elegant Gold",
    plan: body.plan || "starter",
    cover_photo_url: body.coverPhotoUrl?.trim() || null,
    gallery_urls: Array.isArray(body.galleryUrls) ? body.galleryUrls : [],
    events: Array.isArray(body.events) ? body.events : [],
    dress_code: body.dressCode?.trim() || null,
    travel_info: body.travelInfo?.trim() || null,
    music_url: body.musicUrl?.trim() || null,
    shagun_upi: body.shagunUpi?.trim() || null,
    registry_url: body.registryUrl?.trim() || null,
    layout_type: body.layoutType || "classic",
    expires_at: expiresAt,
  };

  const payloadToInsert: Record<string, unknown> = { ...fullPayload };
  let insertRes = await supabase.from("invitations").insert(payloadToInsert).select("id, slug").single();

  // If Supabase table is missing any newly added columns (PGRST204 or 42703),
  // dynamically extract the missing column name from the error message and retry
  let attempts = 0;
  while (insertRes.error && (insertRes.error.code === "PGRST204" || insertRes.error.code === "42703") && attempts < 10) {
    attempts++;
    const missingColMatch = insertRes.error.message.match(/Could not find the '([^']+)' column/i);
    if (missingColMatch && missingColMatch[1] && missingColMatch[1] in payloadToInsert) {
      delete payloadToInsert[missingColMatch[1]];
      insertRes = await supabase.from("invitations").insert(payloadToInsert).select("id, slug").single();
    } else {
      // Fallback: keep only the core guaranteed columns
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
    console.warn("Supabase insert failed, saving to localStore fallback:", error?.message);
    const fallbackRecord = {
      id: crypto.randomUUID(),
      owner_id: ownerId || "local-user",
      created_at: new Date().toISOString(),
      views: 0,
      ...fullPayload,
    };
    localStore.saveInvitation(fallbackRecord as unknown as ExtendedInvitationRecord);
    return NextResponse.json({ id: fallbackRecord.id, slug });
  }

  // Dual-write to localStore so custom fields (contact, events, cover photo) are preserved even if Supabase table has a legacy schema
  const localRecord = {
    id: data.id,
    created_at: new Date().toISOString(),
    views: 0,
    ...fullPayload,
    owner_id: ownerId || "local-user",
  };
  localStore.saveInvitation(localRecord as unknown as ExtendedInvitationRecord);

  return NextResponse.json({ id: data.id, slug: data.slug });
}
