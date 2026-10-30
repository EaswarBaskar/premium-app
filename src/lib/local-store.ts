import fs from "fs";
import path from "path";
import type { InvitationRecord } from "./invitations";

export type LocalRsvp = {
  id: string;
  invitation_id: string;
  name: string;
  guest_count: number;
  response: string;
  message: string;
  event_name?: string | null;
  created_at: string;
};

type LocalDb = {
  invitations: Record<string, InvitationRecord>;
  rsvps: LocalRsvp[];
};

const DB_FILE = path.join(process.cwd(), ".local-db.json");

function loadDb(): LocalDb {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch {}
  return { invitations: {}, rsvps: [] };
}

function saveDb(data: LocalDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export const localStore = {
  updateInvitation(slug: string, updates: Partial<InvitationRecord>) {
    const db = loadDb();
    const inv = db.invitations[slug.toLowerCase()];
    if (inv) {
      Object.assign(inv, updates);
      saveDb(db);
      return inv;
    }
    return null;
  },

  saveInvitation(record: InvitationRecord & { views?: number; created_at?: string; owner_id?: string }) {
    const db = loadDb();
    db.invitations[record.slug.toLowerCase()] = record;
    saveDb(db);
    return record;
  },

  getInvitationBySlug(slug: string): InvitationRecord | null {
    const db = loadDb();
    return db.invitations[slug.toLowerCase()] || null;
  },

  getLatestInvitation(): (InvitationRecord & { views?: number }) | null {
    const db = loadDb();
    const list = Object.values(db.invitations);
    return list.length > 0 ? list[list.length - 1] : null;
  },

  incrementViews(slug: string, guestName?: string | null, place?: string | null) {
    const db = loadDb();
    const inv = db.invitations[slug.toLowerCase()];
    if (inv) {
      const current = Number((inv as any).views) || 0;
      (inv as any).views = current + 1;
      
      const loc = place || "India";
      if (!(inv as any).viewsByPlace) (inv as any).viewsByPlace = {};
      (inv as any).viewsByPlace[loc] = ((inv as any).viewsByPlace[loc] || 0) + 1;

      if (guestName) {
        if (!(inv as any).visitorLog) (inv as any).visitorLog = [];
        (inv as any).visitorLog.unshift({
          guest: guestName,
          place: loc,
          time: new Date().toISOString(),
        });
        if ((inv as any).visitorLog.length > 50) (inv as any).visitorLog.pop();
      }
      saveDb(db);
      return (inv as any).views;
    }
    return 0;
  },

  saveRsvp(rsvp: LocalRsvp) {
    const db = loadDb();
    db.rsvps.push(rsvp);
    saveDb(db);
    return rsvp;
  },

  getRsvps(): LocalRsvp[] {
    const db = loadDb();
    return db.rsvps;
  },

  getAllInvitations(): (InvitationRecord & { views?: number; created_at?: string; owner_id?: string })[] {
    const db = loadDb();
    return Object.values(db.invitations);
  },

  deleteInvitation(slug: string): boolean {
    const db = loadDb();
    const key = slug.toLowerCase();
    if (db.invitations[key]) {
      delete db.invitations[key];
      // remove associated rsvps
      db.rsvps = db.rsvps.filter((r) => r.invitation_id !== key);
      saveDb(db);
      return true;
    }
    return false;
  },

  extendValidity(slug: string, extraDays = 7): string | null {
    const db = loadDb();
    const inv = db.invitations[slug.toLowerCase()];
    if (!inv) return null;
    const currentExpiry = (inv as any).expires_at ? new Date((inv as any).expires_at).getTime() : Date.now();
    const newExpiry = new Date(Math.max(Date.now(), currentExpiry) + extraDays * 86400000).toISOString();
    (inv as any).expires_at = newExpiry;
    saveDb(db);
    return newExpiry;
  },
};

