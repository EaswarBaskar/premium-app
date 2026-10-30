import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";
import { localStore } from "@/lib/local-store";
import InviteClient, { Invite } from "./InviteClient";

async function getInvite(slug: string): Promise<Invite | null> {
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) return (invitationToClient(data) as unknown) as Invite;
    } catch {}
  }
  const local = localStore.getInvitationBySlug(slug);
  return local ? ((invitationToClient(local) as unknown) as Invite) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getInvite(slug);
  if (!invite) return { title: "Invitation not found · TRAXVA" };
  const name = invite.eventType === "Birthday" ? invite.firstName : `${invite.firstName} & ${invite.secondName}`;
  const title = `${name} · ${invite.eventType} invitation`;
  const description = `${dateLabel(invite.date)} · ${invite.venue}. Created with TRAXVA — A Product by Eantrax.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", images: [`/invite/${slug}/opengraph-image`] },
    twitter: { card: "summary_large_image", title, description, images: [`/invite/${slug}/opengraph-image`] },
  };
}

function dateLabel(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.getTime())
    ? "Date to be announced"
    : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(value);
}

export default async function InvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ g?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const guestName = sp.g ? sp.g.trim() : null;

  let place = "India";
  try {
    const headerList = await headers();
    const city = headerList.get("x-vercel-ip-city") || headerList.get("cf-ipcity");
    const country = headerList.get("x-vercel-ip-country") || headerList.get("cf-ipcountry") || "India";
    place = city ? `${city}, ${country}` : country === "IN" ? "India" : country;
  } catch {}

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    localStore.incrementViews(slug, guestName, place);
  } else {
    try {
      const { data } = await supabase.from("invitations").select("id, views").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        await supabase.from("invitations").update({ views: (data.views || 0) + 1 }).eq("id", data.id);
      }
    } catch {}
  }

  const invite = await getInvite(slug);
  if (!invite) notFound();
  return <InviteClient invite={invite} slug={slug.toLowerCase()} />;
}
