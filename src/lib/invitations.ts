export type InvitationRecord = {
  id: string;
  slug: string;
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
  cover_photo_url?: string | null;
  gallery_urls?: string[] | null;
  events?: Array<{ name: string; date: string; time: string; venue: string; address?: string }> | null;
  dress_code?: string | null;
  travel_info?: string | null;
  music_url?: string | null;
};

export function invitationToClient(value: InvitationRecord) {
  return {
    eventType: value.event_type,
    firstName: value.first_name,
    secondName: value.second_name || "",
    age: value.age || "",
    date: value.date,
    time: value.time,
    venue: value.venue,
    address: value.address,
    maps: value.maps || "",
    message: value.message,
    template: value.template,
    coverPhotoUrl: value.cover_photo_url || "",
    galleryUrls: value.gallery_urls || [],
    events: value.events || [],
    dressCode: value.dress_code || "",
    travelInfo: value.travel_info || "",
    musicUrl: value.music_url || "",
    plan: value.plan,
    expiresAt: value.expires_at ? new Date(value.expires_at).getTime() : undefined,
  };
}
