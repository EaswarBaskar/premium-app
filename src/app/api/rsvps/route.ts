import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { localStore } from "@/lib/local-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const list = localStore.getRsvps();
    if (slug) {
      const inv = localStore.getInvitationBySlug(slug);
      const filtered = list.filter((r) => r.invitation_id === slug || (inv && r.invitation_id === inv.id));
      return NextResponse.json(filtered);
    }
    return NextResponse.json(list);
  }

  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  let invitationIds: string[] = [];

  if (slug) {
    // Specifically target this invitation
    try {
      const { data: inv } = await supabase.from("invitations").select("id").eq("slug", slug).maybeSingle();
      if (inv) {
        invitationIds = [inv.id];
      }
    } catch {}

    const localInv = localStore.getInvitationBySlug(slug);
    if (localInv && !invitationIds.includes(localInv.id)) {
      invitationIds.push(localInv.id);
    }
  } else {
    // Find all invitations owned by this user
    try {
      const { data: userInvites } = await supabase.from("invitations").select("id").eq("owner_id", user.id);
      invitationIds = (userInvites || []).map((row: { id: string }) => row.id);
    } catch {}

    const localOwned = localStore.getAllInvitations().filter((inv) => (inv as any).owner_id === user.id);
    const localIds = localOwned.map((inv) => inv.id);
    invitationIds = [...new Set([...invitationIds, ...localIds])];
  }

  // If no invitations found for this user/slug, return empty array immediately (NEVER return other people's RSVPs)
  if (!invitationIds.length) return NextResponse.json([]);

  let data: any[] = [];
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
      data = retry.data || [];
    } else if (res.data) {
      data = res.data;
    }
  } catch {}

  // Include any localStore RSVPs for these invitation IDs or slug
  const localRsvps = localStore.getRsvps().filter((r) => 
    invitationIds.includes(r.invitation_id) || (slug && r.invitation_id === slug)
  );

  const combined = [...data, ...localRsvps];
  const seen = new Set();
  const deduped = combined.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return NextResponse.json(deduped);
}
