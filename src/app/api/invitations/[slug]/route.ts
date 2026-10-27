import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { slug } = await params;
  const { data, error } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Invitation not found." }, { status: 404 });
  await supabase.from("invitations").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
  return NextResponse.json(invitationToClient(data));
}

