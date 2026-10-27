import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";
import InviteClient, { Invite } from "./InviteClient";

async function getInvite(slug: string): Promise<Invite | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
  return data ? invitationToClient(data) as Invite : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const invite = await getInvite(slug);
  if (!invite) return { title: "Invitation not found · Invite7" };
  const name = invite.eventType === "Birthday" ? invite.firstName : `${invite.firstName} & ${invite.secondName}`;
  const title = `${name} · ${invite.eventType} invitation`;
  const description = `${dateLabel(invite.date)} · ${invite.venue}. Created with Invite7.`;
  return { title, description, openGraph: { title, description, type: "website", images: [`/invite/${slug}/opengraph-image`] }, twitter: { card: "summary_large_image", title, description, images: [`/invite/${slug}/opengraph-image`] } };
}

function dateLabel(date: string) { const value = new Date(`${date}T12:00:00`); return Number.isNaN(value.getTime()) ? "Date to be announced" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(value); }

export default async function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invite = await getInvite(slug);
  if (!invite) notFound();
  return <InviteClient invite={invite} slug={slug.toLowerCase()} />;
}
