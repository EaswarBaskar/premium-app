import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";

function slugPart(value: string) {
  return value.trim().normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in before publishing." }, { status: 401 });
  const body = await request.json();
  if (JSON.stringify(body).length > 100000) return NextResponse.json({ error: "Invitation data is too large." }, { status: 413 });
  if (typeof body.firstName !== "string" || !body.firstName.trim() || !body.date || !body.time || typeof body.venue !== "string" || !body.venue.trim()) return NextResponse.json({ error: "Name, date, time and venue are required." }, { status: 400 });
  if (body.firstName.trim().length > 100 || String(body.secondName || "").length > 100 || String(body.message || "").length > 2000) return NextResponse.json({ error: "Some invitation fields are too long." }, { status: 400 });
  const prefix = [slugPart(body.firstName), slugPart(body.secondName || body.age)].filter(Boolean).join("-") || "invitation";
  const slug = `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  const days = body.plan === "keepsake" ? 30 : body.plan === "signature" ? 7 : 3;
  const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
  const fullPayload: Record<string, unknown> = {
    owner_id: user.id, slug, event_type: body.eventType, first_name: body.firstName.trim(), second_name: body.secondName?.trim() || null,
    age: body.age || null, date: body.date, time: body.time, venue: body.venue.trim(), address: body.address?.trim() || "",
    maps: body.maps?.trim() || null, message: body.message?.trim() || "", template: body.template || "Elegant Gold", plan: body.plan || "starter", cover_photo_url: body.coverPhotoUrl?.trim() || null, gallery_urls: Array.isArray(body.galleryUrls) ? body.galleryUrls : [], events: Array.isArray(body.events) ? body.events : [], dress_code: body.dressCode?.trim() || null, travel_info: body.travelInfo?.trim() || null, music_url: body.musicUrl?.trim() || null, expires_at: expiresAt,
  };
  let { data, error } = await supabase.from("invitations").insert(fullPayload).select("id, slug").single();
  if (error && error.code === "PGRST204") {
    const basePayload: Record<string, unknown> = {
      slug, event_type: body.eventType, first_name: body.firstName.trim(), second_name: body.secondName?.trim() || null,
      age: body.age || null, date: body.date, time: body.time, venue: body.venue.trim(), address: body.address?.trim() || "",
      maps: body.maps?.trim() || null, message: body.message?.trim() || "", template: body.template || "Elegant Gold", plan: body.plan || "starter", expires_at: expiresAt,
    };
    const retry = await supabase.from("invitations").insert(basePayload).select("id, slug").single();
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, slug: data.slug });
}
