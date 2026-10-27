import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { data: initialInvites, error: inviteErr } = await supabase.from("invitations").select("id").eq("owner_id", user.id);
  let invites = initialInvites;
  if (inviteErr && inviteErr.code === "PGRST204") {
    const allInvites = await supabase.from("invitations").select("id");
    invites = allInvites.data;
  }
  const invitationIds = (invites || []).map((invite: { id: string }) => invite.id);
  if (!invitationIds.length) return NextResponse.json([]);
  let { data, error } = await supabase.from("rsvps").select("id, name, guest_count, response, event_name, message, created_at, invitations(slug, first_name, second_name)").in("invitation_id", invitationIds).order("created_at", { ascending: false }).limit(500);
  if (error && (error.code === "PGRST204" || error.message?.includes("event_name"))) {
    const retry = await supabase.from("rsvps").select("id, name, guest_count, response, message, created_at, invitations(slug, first_name, second_name)").in("invitation_id", invitationIds).order("created_at", { ascending: false }).limit(500);
    data = retry.data;
    error = retry.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
