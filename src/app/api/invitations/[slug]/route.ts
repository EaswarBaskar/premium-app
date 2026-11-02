import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";
import { localStore, type ExtendedInvitationRecord } from "@/lib/local-store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const local = localStore.getInvitationBySlug(slug);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        await supabase.from("invitations").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
        const merged = { ...local, ...data };
        if (!merged.contact && local?.contact) merged.contact = local.contact;
        return NextResponse.json(invitationToClient(merged));
      }
    } catch {}
  }

  if (!local) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  localStore.incrementViews(slug);
  return NextResponse.json(invitationToClient(local));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let body: Partial<ExtendedInvitationRecord>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Always update localStore to ensure immediate availability & local resilience
  const localUpdated = localStore.updateInvitation(slug, body);

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("invitations").update(body).eq("slug", slug.toLowerCase()).select().maybeSingle();
      if (!error && data) {
        const merged = { ...localUpdated, ...data };
        if (!merged.contact && localUpdated?.contact) merged.contact = localUpdated.contact;
        return NextResponse.json(invitationToClient(merged));
      }
    } catch {}
  }

  if (!localUpdated) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json(invitationToClient(localUpdated));
}
