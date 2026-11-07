import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { invitationToClient } from "@/lib/invitations";
import { localStore, type ExtendedInvitationRecord } from "@/lib/local-store";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeSlug, sanitizeText, sanitizeUrl, sanitizeUpi, sanitizePhone } from "@/lib/sanitize";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params;
  const slug = sanitizeSlug(rawSlug);

  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`invite-get:${ip}`, { windowMs: 60 * 1000, max: 120 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const local = localStore.getInvitationBySlug(slug);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        await supabase.from("invitations").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
        const merged = { ...local, ...data };
        if (!merged.contact && local?.contact) merged.contact = local.contact;
        return NextResponse.json(invitationToClient(merged), { headers: rateLimit.headers });
      }
    } catch {}
  }

  if (!local) {
    return NextResponse.json({ error: "Invitation not found." }, { status: 404, headers: rateLimit.headers });
  }
  localStore.incrementViews(slug);
  return NextResponse.json(invitationToClient(local), { headers: rateLimit.headers });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`invite-patch:${ip}`, { windowMs: 10 * 60 * 1000, max: 30 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many update requests. Please wait a few minutes." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const { slug: rawSlug } = await params;
  const slug = sanitizeSlug(rawSlug);

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: rateLimit.headers });
  }

  if (!rawBody || typeof rawBody !== "object") {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400, headers: rateLimit.headers });
  }

  // 1. Verify Authentication & Authorization
  const supabase = getSupabaseAdmin();
  const isAdmin = await verifyAdminAuth(request);

  let userId: string | null = null;
  if (supabase) {
    const authClient = await createSupabaseServerClient();
    const { data: { user } } = await authClient.auth.getUser();
    userId = user?.id || null;

    if (!isAdmin && !userId) {
      return NextResponse.json({ error: "Authentication required to update invitation." }, { status: 401, headers: rateLimit.headers });
    }

    // Check ownership in Supabase
    const { data: existingInvite } = await supabase
      .from("invitations")
      .select("id, owner_id")
      .eq("slug", slug.toLowerCase())
      .maybeSingle();

    if (existingInvite) {
      if (!isAdmin && existingInvite.owner_id && existingInvite.owner_id !== userId) {
        return NextResponse.json({ error: "Access denied. You do not own this invitation." }, { status: 403, headers: rateLimit.headers });
      }
    }
  }

  // 2. Strict Whitelist & Input Sanitization (mapping to snake_case schema)
  const sanitizedUpdates: Partial<ExtendedInvitationRecord> = {};

  const firstNameInput = rawBody.first_name ?? rawBody.firstName;
  if (typeof firstNameInput === "string") sanitizedUpdates.first_name = sanitizeText(firstNameInput, 100);

  const secondNameInput = rawBody.second_name ?? rawBody.secondName;
  if (typeof secondNameInput === "string") sanitizedUpdates.second_name = sanitizeText(secondNameInput, 100);

  const eventTypeInput = rawBody.event_type ?? rawBody.eventType;
  if (typeof eventTypeInput === "string") sanitizedUpdates.event_type = sanitizeText(eventTypeInput, 50);

  if (typeof rawBody.date === "string") sanitizedUpdates.date = sanitizeText(rawBody.date, 30);
  if (typeof rawBody.time === "string") sanitizedUpdates.time = sanitizeText(rawBody.time, 30);
  if (typeof rawBody.venue === "string") sanitizedUpdates.venue = sanitizeText(rawBody.venue, 200);
  if (typeof rawBody.address === "string") sanitizedUpdates.address = sanitizeText(rawBody.address, 300);
  if (typeof rawBody.message === "string") sanitizedUpdates.message = sanitizeText(rawBody.message, 2000);
  if (typeof rawBody.template === "string") sanitizedUpdates.template = sanitizeText(rawBody.template, 50);
  if (typeof rawBody.plan === "string") sanitizedUpdates.plan = sanitizeText(rawBody.plan, 30);

  const dressCodeInput = rawBody.dress_code ?? rawBody.dressCode;
  if (typeof dressCodeInput === "string") sanitizedUpdates.dress_code = sanitizeText(dressCodeInput, 100);

  const travelInfoInput = rawBody.travel_info ?? rawBody.travelInfo;
  if (typeof travelInfoInput === "string") sanitizedUpdates.travel_info = sanitizeText(travelInfoInput, 500);

  if ("maps" in rawBody) sanitizedUpdates.maps = sanitizeUrl(rawBody.maps);

  const coverInput = rawBody.cover_photo_url ?? rawBody.coverPhotoUrl;
  if (coverInput !== undefined) sanitizedUpdates.cover_photo_url = sanitizeUrl(coverInput);

  const musicInput = rawBody.music_url ?? rawBody.musicUrl;
  if (musicInput !== undefined) sanitizedUpdates.music_url = sanitizeUrl(musicInput);

  const registryInput = rawBody.registry_url ?? rawBody.registryUrl;
  if (registryInput !== undefined) sanitizedUpdates.registry_url = sanitizeUrl(registryInput);

  const shagunInput = rawBody.shagun_upi ?? rawBody.shagunUpi;
  if (shagunInput !== undefined) sanitizedUpdates.shagun_upi = sanitizeUpi(shagunInput);

  if ("contact" in rawBody) sanitizedUpdates.contact = sanitizePhone(rawBody.contact);

  const galleryInput = rawBody.gallery_urls ?? rawBody.galleryUrls;
  if (Array.isArray(galleryInput)) {
    sanitizedUpdates.gallery_urls = galleryInput
      .map((url) => sanitizeUrl(url))
      .filter((url): url is string => Boolean(url))
      .slice(0, 20);
  }

  if (Array.isArray(rawBody.events)) {
    sanitizedUpdates.events = rawBody.events
      .slice(0, 10)
      .map((ev) => ({
        name: sanitizeText(ev?.name, 80),
        date: sanitizeText(ev?.date, 30),
        time: sanitizeText(ev?.time, 30),
        venue: sanitizeText(ev?.venue, 150),
        address: sanitizeText(ev?.address, 200),
      }));
  }

  // Update localStore
  const localUpdated = localStore.updateInvitation(slug, sanitizedUpdates);

  // Update Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("invitations")
        .update(sanitizedUpdates)
        .eq("slug", slug.toLowerCase())
        .select()
        .maybeSingle();

      if (!error && data) {
        const merged = { ...localUpdated, ...data };
        if (!merged.contact && localUpdated?.contact) merged.contact = localUpdated.contact;
        return NextResponse.json(invitationToClient(merged), { headers: rateLimit.headers });
      }
    } catch {}
  }

  if (!localUpdated) {
    return NextResponse.json({ error: "Invitation not found" }, { status: 404, headers: rateLimit.headers });
  }
  return NextResponse.json(invitationToClient(localUpdated), { headers: rateLimit.headers });
}
