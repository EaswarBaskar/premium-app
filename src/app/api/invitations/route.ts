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
    expires_at: expiresAt,
  };

  let { data, error } = await supabase.from("invitations").insert(fullPayload).select("id, slug").single();
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    const basePayload: Record<string, unknown> = {
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
      expires_at: expiresAt,
    };
    const retry = await supabase.from("invitations").insert(basePayload).select("id, slug").single();
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
