import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function allowed(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  current.count += 1;
  return current.count <= MAX_ATTEMPTS;
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!allowed(request)) return NextResponse.json({ error: "Too many RSVP attempts. Please try again later." }, { status: 429 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { slug } = await params;
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid RSVP data." }, { status: 400 }); }
  if (JSON.stringify(body).length > 10000) return NextResponse.json({ error: "RSVP is too large." }, { status: 413 });
  if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Your name is required." }, { status: 400 });
  if (body.name.trim().length > 120 || String(body.message || "").length > 1000) return NextResponse.json({ error: "Please keep your RSVP shorter." }, { status: 400 });
  const guestCount = Number(body.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) return NextResponse.json({ error: "Guest count must be between 1 and 20." }, { status: 400 });
  const { data: invite, error: inviteError } = await supabase.from("invitations").select("id, expires_at").eq("slug", slug.toLowerCase()).maybeSingle();
  if (inviteError || !invite) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
  const response = ["attending", "maybe", "declined"].includes(String(body.response)) ? String(body.response) : "attending";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const eventName = typeof body.eventName === "string" ? body.eventName.trim().slice(0, 120) : null;
  const payload: Record<string, unknown> = { invitation_id: invite.id, name: body.name.trim(), guest_count: guestCount, message, response };
  if (eventName) payload.event_name = eventName;
  let { error } = await supabase.from("rsvps").insert(payload);
  if (error && error.code === "PGRST204" && "event_name" in payload) {
    delete payload.event_name;
    const retry = await supabase.from("rsvps").insert(payload);
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
