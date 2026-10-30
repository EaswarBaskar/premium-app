import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { invitationToClient } from "@/lib/invitations";
import { localStore } from "@/lib/local-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedSlug = searchParams.get("slug")?.trim().toLowerCase();

  const supabase = getSupabaseAdmin();
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();

  // 1. If in local demo mode (Supabase not configured)
  if (!supabase) {
    if (requestedSlug) {
      const inv = localStore.getInvitationBySlug(requestedSlug);
      if (inv) return NextResponse.json({ ...invitationToClient(inv), slug: inv.slug, views: (inv as any).views || 0 });
    }
    const local = localStore.getLatestInvitation();
    return NextResponse.json(local ? { ...invitationToClient(local), slug: local.slug, views: (local as any).views || 0 } : null);
  }

  // Supabase is configured: user must be authenticated to access their host dashboard
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  // 2. If a specific slug is requested (from /dashboard?slug=... or localStorage)
  if (requestedSlug) {
    // Check Supabase first
    try {
      const { data, error } = await supabase.from("invitations").select("*").eq("slug", requestedSlug).maybeSingle();
      if (!error && data) {
        // If owner_id column exists in Supabase and was null, claim it for this user!
        if (!data.owner_id) {
          try {
            await supabase.from("invitations").update({ owner_id: user.id }).eq("id", data.id);
            data.owner_id = user.id;
          } catch {}
        }
        // Also claim in localStore
        localStore.updateInvitation(requestedSlug, { owner_id: user.id } as any);
        return NextResponse.json({ ...invitationToClient(data), slug: data.slug, views: data.views || 0 });
      }
    } catch {}

    // Check localStore fallback
    const local = localStore.getInvitationBySlug(requestedSlug);
    if (local) {
      localStore.updateInvitation(requestedSlug, { owner_id: user.id } as any);
      return NextResponse.json({ ...invitationToClient(local), slug: local.slug, views: (local as any).views || 0 });
    }
  }

  // 3. No specific slug requested: look for the latest invitation owned by this user in Supabase
  try {
    const { data, error } = await supabase
      .from("invitations")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      return NextResponse.json({ ...invitationToClient(data), slug: data.slug, views: data.views || 0 });
    }
  } catch {}

  // 4. Look for an invitation owned by this user in localStore
  const allLocal = localStore.getAllInvitations();
  const ownedLocal = allLocal
    .filter((inv) => (inv as any).owner_id === user.id)
    .sort((a, b) => ((b as any).created_at || "").localeCompare((a as any).created_at || ""));
  if (ownedLocal.length > 0) {
    const latest = ownedLocal[0];
    return NextResponse.json({ ...invitationToClient(latest), slug: latest.slug, views: (latest as any).views || 0 });
  }

  // 5. User has no invitations yet. Do NOT leak other people's invitations!
  return NextResponse.json(null);
}
