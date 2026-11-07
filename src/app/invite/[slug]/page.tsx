import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { invitationToClient } from "@/lib/invitations";
import { localStore } from "@/lib/local-store";
import InviteClient, { Invite, Wish } from "./InviteClient";

const DEMO_INVITE: Invite = {
  id: "demo-invitation-id",
  slug: "demo",
  eventType: "Wedding",
  firstName: "Aarav",
  secondName: "Meera",
  date: "2026-11-28",
  time: "19:00",
  venue: "The Royal Palace, Udaipur",
  address: "Palace Road, Udaipur, Rajasthan",
  maps: "https://maps.google.com",
  message:
    "Together with our families, we would love to celebrate our special day with you. Your presence and blessings will make our moments truly memorable.",
  contact: "9876543210",
  template: "Royal Indian",
  coverPhotoUrl: "",
  galleryUrls: [],
  events: [
    { name: "Haldi & Mehndi", date: "2026-11-27", time: "11:00", venue: "The Rose Courtyard", address: "Palace Gardens" },
    { name: "Sangeet Night", date: "2026-11-27", time: "19:30", venue: "The Royal Ballroom", address: "Palace Wing" },
    { name: "Muhurtham & Reception", date: "2026-11-28", time: "19:00", venue: "The Grand Pavilion", address: "Palace Road, Udaipur" },
  ],
  dressCode: "Festive Indian / Royal Ethnic",
  travelInfo: "Valet parking available at the main palace portico. Accommodations reserved for out-of-town guests.",
  musicUrl: "/audio/shehnai-celebration.wav",
  shagunUpi: "host@upi",
  registryUrl: "https://amazon.in",
  layoutType: "classic",
  views: 1420,
};

const DEMO_WISHES: Wish[] = [
  { id: "wish-1", name: "Rohan & Sneha", message: "Wishing you both a lifetime of immense joy, laughter, and endless adventures together!", createdAt: "2026-11-01T10:00:00Z" },
  { id: "wish-2", name: "Vikram & Family", message: "Heartiest congratulations Aarav and Meera. May your journey ahead be blessed with good health and happiness.", createdAt: "2026-11-02T14:30:00Z" },
  { id: "wish-3", name: "Pooja Sharma", message: "So thrilled for you both! Practicing dance steps for the Sangeet night already! 💃✨", createdAt: "2026-11-03T18:15:00Z" },
];

async function getInvite(slug: string, requestedTheme?: string): Promise<Invite | null> {
  const local = localStore.getInvitationBySlug(slug);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { data } = await supabase.from("invitations").select("*").eq("slug", slug.toLowerCase()).maybeSingle();
      if (data) {
        // Merge Supabase with local store so custom fields are never lost
        const merged = { ...local, ...data };
        if (!merged.contact && local?.contact) merged.contact = local.contact;
        return (invitationToClient(merged) as unknown) as Invite;
      }
    } catch {}
  }
  if (local) {
    return (invitationToClient(local) as unknown) as Invite;
  }

  // Graceful Demo Fallback only for explicit demo template previews
  const isDemo = slug.toLowerCase() === "demo" || slug.toLowerCase().startsWith("demo-");
  if (isDemo) {
    const themeOverride = requestedTheme || (slug.includes("gardenFloral") ? "Garden Floral" : slug.includes("midnightLuxe") ? "Midnight Luxe" : "Royal Indian");
    return {
      ...DEMO_INVITE,
      slug: slug.toLowerCase(),
      template: themeOverride,
    };
  }

  return null;
}

async function getWishes(slug: string, invitationId?: string): Promise<Wish[]> {
  const wishes: Wish[] = [];
  const supabase = getSupabaseAdmin();
  if (supabase && invitationId) {
    try {
      const { data } = await supabase
        .from("rsvps")
        .select("id, name, message, created_at")
        .eq("invitation_id", invitationId)
        .neq("message", "")
        .order("created_at", { ascending: false })
        .limit(30);
      if (data) {
        data.forEach((r: { id: string; name: string; message: string; created_at: string }) => {
          if (r.message && r.message.trim()) {
            wishes.push({ id: r.id, name: r.name, message: r.message.trim(), createdAt: r.created_at });
          }
        });
      }
    } catch {}
  }
  const localRsvps = localStore.getRsvps();
  localRsvps.forEach((r) => {
    if ((r.invitation_id === slug || (invitationId && r.invitation_id === invitationId)) && r.message?.trim()) {
      if (!wishes.some((w) => w.id === r.id)) {
        wishes.push({ id: r.id, name: r.name, message: r.message.trim(), createdAt: r.created_at });
      }
    }
  });

  // Only return sample wishes if strictly in demo showcase mode
  if (wishes.length === 0 && (slug.toLowerCase() === "demo" || slug.toLowerCase().startsWith("demo-"))) {
    return DEMO_WISHES;
  }

  return wishes;
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<{ theme?: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const invite = await getInvite(slug, sp?.theme);
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
  searchParams?: Promise<{ g?: string; guest?: string; theme?: string; demo?: string }>;
}) {
  const { slug } = await params;
  const sp = searchParams ? await searchParams : {};
  const guestName = (sp.guest || sp.g)?.trim() || null;

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

  const invite = await getInvite(slug, sp.theme);
  if (!invite) notFound();
  const wishes = await getWishes(slug, invite.id);
  return <InviteClient invite={invite} slug={slug.toLowerCase()} initialWishes={wishes} />;
}
