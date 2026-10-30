import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore } from "@/lib/local-store";

function slugPart(value: unknown) {
  return String(value || "").trim().normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json();
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
      event_type: body.eventType,
      first_name: body.firstName.trim(),
      second_name: body.secondName?.trim() || null,
      age: body.age || null,
      date: body.date,
      time: body.time,
      venue: body.venue.trim(),
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
    event_type: body.eventType,
    first_name: body.firstName.trim(),
    second_name: body.secondName?.trim() || null,
    age: body.age || null,
    date: body.date,
    time: body.time,
    venue: body.venue.trim(),
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
  if (error && error.code === "PGRST204") {
    const basePayload: Record<string, unknown> = {
      slug,
      event_type: body.eventType,
      first_name: body.firstName.trim(),
      second_name: body.secondName?.trim() || null,
      age: body.age || null,
      date: body.date,
      time: body.time,
      venue: body.venue.trim(),
      address: body.address?.trim() || "",
      maps: body.maps?.trim() || null,
      message: body.message?.trim() || "",
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
  };
  localStore.saveInvitation(localRecord as any);

  return NextResponse.json({ id: data.id, slug: data.slug });
}
