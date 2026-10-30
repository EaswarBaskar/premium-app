import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";
import { localStore } from "@/lib/local-store";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        await supabase.from("invitations").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
        return NextResponse.json(invitationToClient(data));
      }
    } catch {}
  }

  const local = localStore.getInvitationBySlug(slug);
  if (!local) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  localStore.incrementViews(slug);
  return NextResponse.json(invitationToClient(local));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("invitations").update(body).eq("slug", slug.toLowerCase()).select().maybeSingle();
      if (!error && data) {
        return NextResponse.json(invitationToClient(data));
      }
    } catch {}
  }

  let updated = localStore.updateInvitation(slug, body as any);
  if (!updated && supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        const merged = { ...data, ...body };
        localStore.saveInvitation(merged as any);
        updated = merged as any;
      }
    } catch {}
  }

  if (!updated) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  return NextResponse.json(invitationToClient(updated));
}
