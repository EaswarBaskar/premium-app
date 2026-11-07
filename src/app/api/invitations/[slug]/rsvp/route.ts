import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localStore } from "@/lib/local-store";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeSlug, sanitizeText } from "@/lib/sanitize";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`rsvp:${ip}`, {
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 8,                   // Max 8 RSVPs per 10 mins
  });

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many RSVP attempts. Please try again later." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const { slug: rawSlug } = await params;
  const slug = sanitizeSlug(rawSlug);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid RSVP data." }, { status: 400, headers: rateLimit.headers });
  }

  if (JSON.stringify(body).length > 10000) {
    return NextResponse.json({ error: "RSVP is too large." }, { status: 413, headers: rateLimit.headers });
  }

  const rawName = typeof body.name === "string" ? body.name.trim() : "";
  if (!rawName) {
    return NextResponse.json({ error: "Your name is required." }, { status: 400, headers: rateLimit.headers });
  }

  const name = sanitizeText(rawName, 120);
  const message = typeof body.message === "string" ? sanitizeText(body.message, 1000) : "";
  const eventName = typeof body.eventName === "string" ? sanitizeText(body.eventName, 120) : null;

  const guestCount = Number(body.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    return NextResponse.json({ error: "Guest count must be between 1 and 20." }, { status: 400, headers: rateLimit.headers });
  }

  const response = ["attending", "maybe", "declined"].includes(String(body.response)) ? String(body.response) : "attending";

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const invite = localStore.getInvitationBySlug(slug);
    if (!invite) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404, headers: rateLimit.headers });
    }
    localStore.saveRsvp({
      id: crypto.randomUUID(),
      invitation_id: invite.id,
      name,
      guest_count: guestCount,
      response,
      message,
      event_name: eventName,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true }, { headers: rateLimit.headers });
  }

  const { data: invite } = await supabase
    .from("invitations")
    .select("id, expires_at")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();

  if (!invite) {
    const local = localStore.getInvitationBySlug(slug);
    if (!local) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404, headers: rateLimit.headers });
    }
    localStore.saveRsvp({
      id: crypto.randomUUID(),
      invitation_id: local.id,
      name,
      guest_count: guestCount,
      response,
      message,
      event_name: eventName,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true }, { headers: rateLimit.headers });
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This invitation has expired." }, { status: 410, headers: rateLimit.headers });
  }

  const payload: Record<string, unknown> = {
    invitation_id: invite.id,
    name,
    guest_count: guestCount,
    message,
    response,
  };
  if (eventName) payload.event_name = eventName;

  let { error } = await supabase.from("rsvps").insert(payload);
  if (error && error.code === "PGRST204" && "event_name" in payload) {
    delete payload.event_name;
    const retry = await supabase.from("rsvps").insert(payload);
    error = retry.error;
  }

  if (error) {
    return NextResponse.json({ error: "Failed to submit RSVP." }, { status: 500, headers: rateLimit.headers });
  }

  return NextResponse.json({ ok: true }, { headers: rateLimit.headers });
}
