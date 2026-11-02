export type InvitationRecord = {
  id: string;
  slug: string;
  owner_id?: string | null;
  event_type: string;
  first_name: string;
  second_name: string | null;
  age: string | null;
  date: string;
  time: string;
  venue: string;
  address: string;
  maps: string | null;
  message: string;
  template: string;
  plan: string;
  expires_at: string | null;
  contact?: string | null;
  cover_photo_url?: string | null;
  gallery_urls?: string[] | null;
  events?: Array<{ name: string; date: string; time: string; venue: string; address?: string }> | null;
  dress_code?: string | null;
  travel_info?: string | null;
  music_url?: string | null;
  shagun_upi?: string | null;
  registry_url?: string | null;
};

export function invitationToClient(value: InvitationRecord) {
  const extra = value as Record<string, unknown>;
  return {
    id: value.id,
    slug: value.slug,
    eventType: value.event_type,
    firstName: value.first_name,
    secondName: value.second_name || "",
    age: value.age || "",
    date: value.date,
    time: value.time,
    venue: value.venue,
    address: value.address,
    maps: value.maps || "",
    contact: value.contact || "",
    message: value.message,
    template: value.template,
    coverPhotoUrl: value.cover_photo_url || "",
    galleryUrls: value.gallery_urls || [],
    events: value.events || [],
    dressCode: value.dress_code || "",
    travelInfo: value.travel_info || "",
    musicUrl: value.music_url || "",
    shagunUpi: value.shagun_upi || "",
    registryUrl: value.registry_url || "",
    plan: value.plan,
    expiresAt: value.expires_at ? new Date(value.expires_at).getTime() : undefined,
    views: typeof extra.views === "number" ? extra.views : 0,
    viewsByPlace: (typeof extra.viewsByPlace === "object" && extra.viewsByPlace !== null ? extra.viewsByPlace : {}) as Record<string, number>,
  };
}
