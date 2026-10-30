import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localStore } from "@/lib/local-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  let invitations: any[] = [];
  let rsvps: any[] = [];
  const isLive = Boolean(supabase);

  if (!supabase) {
    invitations = localStore.getAllInvitations();
    rsvps = localStore.getRsvps();
  } else {
    const [invRes, rsvpRes] = await Promise.all([
      supabase.from("invitations").select("*").order("created_at", { ascending: false }),
      supabase.from("rsvps").select("*, invitations(slug, first_name, second_name)").order("created_at", { ascending: false }),
    ]);

    const liveInvs = invRes.data || [];
    const liveRsvps = rsvpRes.data || [];

    // Also include any local invitations not yet synced to guarantee zero data loss
    const seenSlugs = new Set(liveInvs.map((i: any) => (i.slug || "").toLowerCase()));
    const localInvs = localStore.getAllInvitations().filter((i) => !seenSlugs.has((i.slug || "").toLowerCase()));

    const seenRsvpIds = new Set(liveRsvps.map((r: any) => r.id));
    const localRsvps = localStore.getRsvps().filter((r) => !seenRsvpIds.has(r.id));

    invitations = [...liveInvs, ...localInvs];
    rsvps = [...liveRsvps, ...localRsvps];
  }

  // Calculate platform metrics
  const now = Date.now();
  let totalViews = 0;
  let activeCount = 0;
  let expiredCount = 0;
  const templateBreakdown: Record<string, number> = {};
  const globalPlaces: Record<string, number> = {};
  const planBreakdown: Record<string, number> = { starter: 0, signature: 0, keepsake: 0 };

  const enrichedInvitations = invitations.map((inv) => {
    const views = Number(inv.views) || 0;
    totalViews += views;

    const expiryTime = inv.expires_at ? new Date(inv.expires_at).getTime() : 0;
    const isExpired = expiryTime > 0 && expiryTime < now;
    if (isExpired) {
      expiredCount++;
    } else {
      activeCount++;
    }

    const t = inv.template || "Elegant Gold";
    if (inv.viewsByPlace) {
      Object.entries(inv.viewsByPlace as Record<string, number>).forEach(([place, count]) => {
        globalPlaces[place] = (globalPlaces[place] || 0) + Number(count);
      });
    }
    templateBreakdown[t] = (templateBreakdown[t] || 0) + 1;

    const p = (inv.plan || "starter").toLowerCase();
    planBreakdown[p] = (planBreakdown[p] || 0) + 1;

    // Count RSVPs for this invitation
    const matchingRsvps = rsvps.filter((r) => r.invitation_id === inv.id || r.invitation_id === inv.slug);

    return {
      id: inv.id,
      slug: inv.slug,
      firstName: inv.first_name || inv.firstName,
      secondName: inv.second_name || inv.secondName,
      eventType: inv.event_type || inv.eventType || "Wedding",
      date: inv.date,
      time: inv.time,
      venue: inv.venue,
      template: t,
      plan: p,
      views,
      viewsByPlace: inv.viewsByPlace || {},
      createdAt: inv.created_at || new Date().toISOString(),
      expiresAt: inv.expires_at,
      isExpired,
      rsvpsCount: matchingRsvps.length,
      attendingCount: matchingRsvps.filter((r) => r.response === "attending").length,
    };
  });

  const enrichedRsvps = rsvps.map((r) => {
    if (!r.invitations) {
      const match = invitations.find((i) => i.id === r.invitation_id || i.slug === r.invitation_id);
      if (match) {
        return {
          ...r,
          invitations: {
            slug: match.slug,
            first_name: match.first_name || match.firstName,
            second_name: match.second_name || match.secondName || null,
          },
        };
      }
    }
    return r;
  });

  const attendingRsvps = rsvps.filter((r) => r.response === "attending").length;
  const declinedRsvps = rsvps.filter((r) => r.response === "declined").length;
  const maybeRsvps = rsvps.filter((r) => r.response === "maybe").length;

  return NextResponse.json({
    isLive,
    databaseEngine: isLive ? "Supabase PostgreSQL (Live Production)" : "Local JSON Store",
    databaseHost: process.env.NEXT_PUBLIC_SUPABASE_URL || "Local DB",
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    serverTimestamp: new Date().toISOString(),
    metrics: {
      totalInvitations: invitations.length,
      activeCount,
      expiredCount,
      totalViews,
      totalRsvps: rsvps.length,
      attendingRsvps,
      declinedRsvps,
      maybeRsvps,
      templateBreakdown,
      globalPlaces,
      planBreakdown,
    },
    invitations: enrichedInvitations,
    rsvps: enrichedRsvps,
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Slug required." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const ok = localStore.deleteInvitation(slug);
    return NextResponse.json({ success: ok });
  }

  const { error } = await supabase.from("invitations").delete().eq("slug", slug.toLowerCase());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { slug, action, extraDays = 7 } = body;
  if (!slug) return NextResponse.json({ error: "Slug required." }, { status: 400 });

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    if (action === "extend") {
      const newExpiry = localStore.extendValidity(slug, Number(extraDays) || 7);
      return NextResponse.json({ success: true, expiresAt: newExpiry });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "extend") {
    const { data: inv } = await supabase.from("invitations").select("expires_at").eq("slug", slug.toLowerCase()).single();
    const currentExpiry = inv?.expires_at ? new Date(inv.expires_at).getTime() : Date.now();
    const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + extraDays * 86400000).toISOString();
    await supabase.from("invitations").update({ expires_at: newExpiry }).eq("slug", slug.toLowerCase());
    return NextResponse.json({ success: true, expiresAt: newExpiry });
  }

  return NextResponse.json({ success: true });
}
