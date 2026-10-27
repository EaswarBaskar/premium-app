import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/auth-server";
import { invitationToClient } from "@/lib/invitations";

export async function GET() {
  const authClient = await createSupabaseServerClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  let { data, error } = await supabase.from("invitations").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (error && error.code === "PGRST204") {
    const fallback = await supabase.from("invitations").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ? { ...invitationToClient(data), slug: data.slug, views: data.views || 0 } : null);
}
