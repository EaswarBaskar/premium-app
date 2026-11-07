import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore } from "@/lib/local-store";
import { verifyAdminAuth } from "@/lib/admin-auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeSlug } from "@/lib/sanitize";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`rsvps-get:${ip}`, { windowMs: 60 * 1000, max: 60 });
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: rateLimit.headers }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawSlug = searchParams.get("slug");
  const slug = rawSlug ? sanitizeSlug(rawSlug) : null;

  const supabase = getSupabaseAdmin();
  const isAdmin = await verifyAdminAuth(request);

  // 1. In local demo mode (when Supabase is not configured)
  if (!supabase) {
    if (!slug) {
      // Viewing all RSVPs across all invitations strictly requires admin credentials
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Unauthorized. Administrator credentials required to view global RSVP records." },
          { status: 401, headers: rateLimit.headers }
        );
      }
      return NextResponse.json(localStore.getRsvps(), { headers: rateLimit.headers });
    }

    const inv = localStore.getInvitationBySlug(slug);
    if (!inv) {
      return NextResponse.json({ error: "Invitation not found." }, { status: 404, headers: rateLimit.headers });
    }

    // In local mode, verify admin or local owner
    if (!isAdmin && inv.owner_id && inv.owner_id !== "local-user") {
      return NextResponse.json(
        { error: "Access denied. You do not own this invitation." },
        { status: 403, headers: rateLimit.headers }
      );
    }

    const list = localStore.getRsvps();
    const filtered = list.filter((r) => r.invitation_id === slug || r.invitation_id === inv.id);
    return NextResponse.json(filtered, { headers: rateLimit.headers });
  }

  // 2. In live mode: user must be authenticated or be an admin
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  if (!isAdmin && !user) {
    return NextResponse.json({ error: "Unauthorized access to RSVP records." }, { status: 401, headers: rateLimit.headers });
  }

  let invitationIds: string[] = [];

  if (slug) {
    // Check ownership of this specific slug
    try {
      const { data: inv } = await supabase
        .from("invitations")
        .select("id, owner_id")
        .eq("slug", slug)
        .maybeSingle();

      if (inv) {
        // Enforce IDOR protection: only the owner or an admin can view RSVPs
        if (!isAdmin && inv.owner_id && inv.owner_id !== user?.id) {
          return NextResponse.json({ error: "Access denied. You do not own this invitation." }, { status: 403, headers: rateLimit.headers });
        }
        invitationIds = [inv.id];
      }
    } catch {}

    const localInv = localStore.getInvitationBySlug(slug);
    if (localInv) {
      if (!isAdmin && localInv.owner_id && localInv.owner_id !== "local-user" && localInv.owner_id !== user?.id) {
        return NextResponse.json({ error: "Access denied. You do not own this invitation." }, { status: 403, headers: rateLimit.headers });
      }
      if (!invitationIds.includes(localInv.id)) {
        invitationIds.push(localInv.id);
      }
    }
  } else if (isAdmin) {
    // Admin can view all RSVPs
    try {
      const { data: allInvites } = await supabase.from("invitations").select("id");
      invitationIds = (allInvites || []).map((row: { id: string }) => row.id);
    } catch {}
  } else if (user) {
    // Find all invitations owned by this specific authenticated user
    try {
      const { data: userInvites } = await supabase.from("invitations").select("id").eq("owner_id", user.id);
      invitationIds = (userInvites || []).map((row: { id: string }) => row.id);
    } catch {}

    const localOwned = localStore.getAllInvitations().filter((inv) => inv.owner_id === user.id);
    const localIds = localOwned.map((inv) => inv.id);
    invitationIds = [...new Set([...invitationIds, ...localIds])];
  }

  // If no invitations found for this user/slug, return empty array immediately
  if (!invitationIds.length) {
    return NextResponse.json([], { headers: rateLimit.headers });
  }

  let data: Array<{ id: string; [key: string]: unknown }> = [];
  try {
    const res = await supabase
      .from("rsvps")
      .select("id, name, guest_count, response, event_name, message, created_at, invitations(slug, first_name, second_name)")
      .in("invitation_id", invitationIds)
      .order("created_at", { ascending: false })
      .limit(500);

    if (res.error && (res.error.code === "PGRST204" || res.error.code === "42703")) {
      const retry = await supabase
        .from("rsvps")
        .select("id, name, guest_count, response, message, created_at, invitations(slug, first_name, second_name)")
        .in("invitation_id", invitationIds)
        .order("created_at", { ascending: false })
        .limit(500);
      data = (retry.data || []) as Array<{ id: string; [key: string]: unknown }>;
    } else if (res.data) {
      data = res.data as Array<{ id: string; [key: string]: unknown }>;
    }
  } catch {}

  // Include any localStore RSVPs for these invitation IDs or slug
  const localRsvps = localStore.getRsvps().filter((r) =>
    invitationIds.includes(r.invitation_id) || (slug && r.invitation_id === slug)
  );

  const combined = [...data, ...localRsvps];
  const seen = new Set<string>();
  const deduped = combined.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return NextResponse.json(deduped, { headers: rateLimit.headers });
}
