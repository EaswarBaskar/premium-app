import { ImageResponse } from "next/og";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { localStore } from "@/lib/local-store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

type OgInvitationData = {
  first_name?: string;
  second_name?: string | null;
  date?: string;
  event_type?: string;
  template?: string;
};

export default async function OpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = getSupabaseAdmin();
  let data: OgInvitationData | null = null;
  if (supabase) {
    try {
      const res = await supabase.from("invitations").select("first_name, second_name, date, event_type, template").eq("slug", slug.toLowerCase()).maybeSingle();
      data = res.data;
    } catch {}
  }
  if (!data) {
    data = localStore.getInvitationBySlug(slug);
  }
  const name = data ? (data.event_type === "Birthday" ? data.first_name : `${data.first_name} & ${data.second_name}`) : "Your invitation";
  const date = data && data.date ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${data.date}T12:00:00`)) : "A moment worth sharing";
  const palette = data?.template === "Tamil Heritage" ? { background: "#7a1220", color: "#fff3d9", accent: "#b8861b", muted: "#f3c6a5" } : data?.template === "Temple Kalyanam" ? { background: "#25080e", color: "#fbeccb", accent: "#f2c14e", muted: "#f3c6a5" } : { background: "#263b33", color: "#ede7dc", accent: "#d4b77d", muted: "#bdc9be" };
  return new ImageResponse(<div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: palette.background, color: palette.color, fontFamily: "serif" }}><div style={{ color: palette.accent, fontSize: 28, letterSpacing: 8 }}>TRAXVA</div><div style={{ fontSize: 76, marginTop: 34 }}>{name}</div><div style={{ fontSize: 30, marginTop: 28, color: palette.accent }}>{date}</div><div style={{ fontSize: 20, marginTop: 20, color: palette.muted }}>A Product by Eantrax</div></div>, { ...size });
}
