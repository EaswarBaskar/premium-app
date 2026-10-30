import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localStore } from "@/lib/local-store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  let data: any = null;
  if (supabase) {
    const res = await supabase.from("invitations").select("first_name, second_name, date, event_type").eq("slug", slug.toLowerCase()).maybeSingle();
    data = res.data;
  } else {
    data = localStore.getInvitationBySlug(slug);
  }
  const name = data ? (data.event_type === "Birthday" ? data.first_name : `${data.first_name} & ${data.second_name}`) : "Your invitation";
  const date = data ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${data.date}T12:00:00`)) : "A moment worth sharing";
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#263b33", color: "#ede7dc", fontFamily: "serif" }}><div style={{ color: "#d4b77d", fontSize: 28, letterSpacing: 8 }}>TRAXVA</div><div style={{ fontSize: 76, marginTop: 34 }}>{name}</div><div style={{ fontSize: 30, marginTop: 28, color: "#d4b77d" }}>{date}</div><div style={{ fontSize: 20, marginTop: 20, color: "#bdc9be" }}>A Product by Eantrax</div></div>, { ...size });
}
