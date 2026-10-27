"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Check, Download, MapPin, MessageCircle, Plus, QrCode, Send, Trash2, Upload, Users, X } from "lucide-react";
import baseStyles from "./dashboard.module.css";
import extraStyles from "./dashboardExtras.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const styles = { ...baseStyles, ...extraStyles };
type Guest = { name: string; guests: number; status: "Confirmed" | "Maybe" | "Declined" | "Pending"; meal: string; group: string; phone: string; checkedIn: boolean; event?: string };
type HostInvitation = { slug: string; firstName: string; secondName: string; eventType: string; date: string; venue: string; template: string; events?: { name: string; date: string; time: string; venue: string }[]; views: number };
type ScheduleEvent = { day: string; name: string; details: string };
const starterGuests: Guest[] = [
  { name: "Ananya Sharma", guests: 2, status: "Confirmed", meal: "Vegetarian", group: "Friends", phone: "+91 98765 12345", checkedIn: true },
  { name: "Raghav & family", guests: 4, status: "Confirmed", meal: "Mixed", group: "Groom family", phone: "+91 98450 11223", checkedIn: false },
  { name: "Meera Iyer", guests: 1, status: "Pending", meal: "Vegetarian", group: "Bride family", phone: "+91 99887 66554", checkedIn: false },
  { name: "Karan Mehta", guests: 2, status: "Confirmed", meal: "Jain", group: "Friends", phone: "+91 98111 22334", checkedIn: false },
];

export default function Dashboard() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [guests, setGuests] = useState<Guest[]>(() => {
    if (typeof window === "undefined") return starterGuests;
    try { const saved = window.localStorage.getItem("invite7-guest-list"); return saved ? JSON.parse(saved) as Guest[] : starterGuests; } catch { return starterGuests; }
  });
  const [filter, setFilter] = useState("All guests");
  const [showAdd, setShowAdd] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Guest | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [events, setEvents] = useState<ScheduleEvent[]>([
    { day: "28", name: "Mehendi", details: "Friday · 5:00 PM · Home" },
    { day: "29", name: "Haldi ceremony", details: "Saturday · 10:00 AM · Garden" },
    { day: "30", name: "Wedding ceremony", details: "Sunday · 6:00 PM · Dhana Mahal" },
  ]);
  const [newGuest, setNewGuest] = useState({ name: "", phone: "", group: "Friends", guests: "1", meal: "Vegetarian" });
  const [newEvent, setNewEvent] = useState({ name: "", details: "" });
  const [feedback, setFeedback] = useState("");
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [userEmail, setUserEmail] = useState("");
  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthReady(true);
        setUserEmail(data.user.email || "");
      } else {
        router.replace("/login");
      }
    }).catch(() => router.replace("/login"));
  }, [router]);
  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }
  useEffect(() => { window.localStorage.setItem("invite7-guest-list", JSON.stringify(guests)); }, [guests]);
  useEffect(() => {
    fetch("/api/rsvps").then(async (response) => {
      if (!response.ok) return;
      const rows = await response.json() as RsvpRow[];
      setGuests((current) => {
        const additions = rows.filter((rsvp) => !current.some((guest) => guest.phone === `rsvp:${rsvp.id}`)).map((rsvp) => ({
          name: rsvp.name,
          guests: rsvp.guest_count,
          status: rsvp.response === "attending" ? "Confirmed" as const : rsvp.response === "maybe" ? "Maybe" as const : rsvp.response === "declined" ? "Declined" as const : "Pending" as const,
          meal: "Not specified",
          group: "RSVP response",
          event: rsvp.event_name || "All events",
          phone: `rsvp:${rsvp.id}`,
          checkedIn: false,
        }));
        return additions.length ? [...current, ...additions] : current;
      });
    }).catch(() => undefined);
  }, []);
  useEffect(() => { fetch("/api/invitations/mine").then(async (response) => { if (!response.ok) return; setInvitation(await response.json()); }).catch(() => undefined); }, []);
  const totalSeats = guests.reduce((sum, guest) => sum + guest.guests, 0);
  const confirmedSeats = guests.filter((guest) => guest.status === "Confirmed").reduce((sum, guest) => sum + guest.guests, 0);
  const mealTotals = guests.reduce<Record<string, number>>((totals, guest) => ({ ...totals, [guest.meal]: (totals[guest.meal] || 0) + guest.guests }), {});
  const primaryEvent = invitation?.events?.[0]?.name || events[0]?.name;
  const eventHeadcount = (invitation?.events?.length ? invitation.events : events).map((event) => ({ ...event, count: guests.filter((guest) => guest.event ? guest.event === event.name : event.name === primaryEvent).reduce((sum, guest) => sum + guest.guests, 0) }));
  const responseCounts = { attending: guests.filter((guest) => guest.status === "Confirmed").length, maybe: guests.filter((guest) => guest.status === "Maybe").length, declined: guests.filter((guest) => guest.status === "Declined").length };
  const visibleGuests = useMemo(() => filter === "All guests" ? guests : guests.filter((guest) => guest.status === filter), [filter, guests]);
  function shareGuest(guest: Guest) { const slug = invitation?.slug || "ARJUNPRIYA"; const title = invitation ? `${invitation.firstName}${invitation.secondName ? ` & ${invitation.secondName}` : ""}` : "our celebration"; const link = `${window.location.origin}/invite/${slug}?g=${encodeURIComponent(guest.name)}`; const message = `Hi ${guest.name}, you’re warmly invited to celebrate ${title}. View your invitation: ${link}`; window.open(`https://wa.me/${guest.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); }
  function addGuest(e: FormEvent) { e.preventDefault(); if (!newGuest.name.trim() || !newGuest.phone.trim()) return; setGuests((current) => [...current, { ...newGuest, name: newGuest.name.trim(), phone: newGuest.phone.trim(), guests: Number(newGuest.guests), status: "Pending", checkedIn: false }]); setNewGuest({ name: "", phone: "", group: "Friends", guests: "1", meal: "Vegetarian" }); setShowAdd(false); }
  function removeGuest(guest: Guest) { setPendingRemoval(guest); }
  function confirmRemoveGuest() { if (pendingRemoval) setGuests((current) => current.filter((item) => item !== pendingRemoval)); setPendingRemoval(null); }
  function toggleCheckIn(guest: Guest) { setGuests((current) => current.map((item) => item === guest ? { ...item, checkedIn: !item.checkedIn } : item)); }
  function exportGuestList() { const rows = [["Name", "Guests", "Status", "Meal", "Group", "Phone", "Checked in"], ...guests.map((guest) => [guest.name, guest.guests, guest.status, guest.meal, guest.group, guest.phone, guest.checkedIn ? "Yes" : "No"])].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n"); const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" })); link.download = "invite7-guest-list.csv"; link.click(); URL.revokeObjectURL(link.href); }
  function remindPendingGuests() { guests.filter((guest) => guest.status === "Pending").forEach(shareGuest); }
  function addEvent(event: FormEvent) { event.preventDefault(); if (!newEvent.name.trim() || !newEvent.details.trim()) return; setEvents((current) => [...current, { day: String(current.length + 28), name: newEvent.name.trim(), details: newEvent.details.trim() }]); setNewEvent({ name: "", details: "" }); setShowEventForm(false); }
  async function importContacts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) { setFeedback("Your CSV needs a header row and at least one contact."); return; }
    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    const value = (cells: string[], names: string[], fallback = "") => { const index = names.map((name) => headers.indexOf(name)).find((item) => item >= 0); return index === undefined ? fallback : (cells[index] || fallback).trim(); };
    const imported = lines.slice(1).map((line) => line.split(",")).map((cells) => ({ name: value(cells, ["name", "full name", "contact"]), phone: value(cells, ["phone", "mobile", "whatsapp"]), group: value(cells, ["group", "category"], "Imported contacts"), guests: Number(value(cells, ["guests", "guest count"], "1")) || 1, meal: value(cells, ["meal", "meal preference"], "Not specified"), status: "Pending" as const, checkedIn: false })).filter((guest) => guest.name && guest.phone);
    setGuests((current) => [...current, ...imported.filter((guest) => !current.some((existing) => existing.phone === guest.phone))]);
    event.target.value = "";
    setFeedback(`${imported.length} contact${imported.length === 1 ? "" : "s"} imported.`);
  }

  if (!authReady) return <main className={styles.dashboard}><div className={styles.authLoading}>Checking your account…</div></main>;
    const hostName = invitation ? `${invitation.firstName}${invitation.secondName ? ` & ${invitation.secondName}` : ""}` : (userEmail ? userEmail.split("@")[0] : "Host");
    const activeSlug = invitation?.slug || "arjunpriya";
    return <main className={styles.dashboard}>{feedback && <p role="status" className={styles.feedback}>{feedback}</p>}<HostSummary invitation={invitation} /><section className={styles.analyticsStrip} aria-label="Invitation analytics"><div><small>RSVP RESPONSES</small><strong>{responseCounts.attending} attending · {responseCounts.maybe} maybe · {responseCounts.declined} declined</strong><span>{guests.filter((guest) => guest.status === "Pending").length} pending</span></div><div><small>EVENT HEADCOUNT</small><strong>{eventHeadcount.map((event) => `${event.name}: ${event.count}`).join(" · ") || "No events yet"}</strong><span>{eventHeadcount.length} scheduled events</span></div><div><small>MEAL TOTALS</small><strong>{Object.entries(mealTotals).map(([meal, count]) => `${meal}: ${count}`).join(" · ") || "No meal preferences yet"}</strong><span>Based on current guest list</span></div></section>
    <header className={styles.header}><Link href="/" className={styles.brand}><span>7</span> invite<span>.</span></Link><div className={styles.headerRight}><Link href={`/invite/${activeSlug}`} target="_blank">View invitation <ArrowUpRight size={15} /></Link><button type="button" onClick={signOut} className={styles.signOutBtn}>Sign out</button><div className={styles.avatar}>{userEmail ? userEmail.slice(0, 2).toUpperCase() : "AS"}</div></div></header>
    <div className={styles.layout}><aside><div className={styles.host}><div className={styles.hostAvatar}>{hostName.slice(0, 1).toUpperCase()}</div><div><strong>{hostName}</strong><small>{userEmail || "Host account"}</small></div></div><nav><a className={styles.active} href="#overview">Overview</a><a href="#guests">Guest list <b>{guests.length}</b></a><a href="#schedule">Wedding schedule</a><a href="#settings">Invitation settings</a></nav><Link href="/" className={styles.create}><Plus size={15} /> New invitation</Link></aside>
      <section className={styles.content}><div className={styles.pageIntro}><div><div className={styles.kicker}>WELCOME BACK, {(invitation?.firstName || userEmail?.split("@")[0] || "HOST").toUpperCase()}</div><h1>Your celebration,<br /><em>beautifully organised.</em></h1></div><button className={styles.reminder} onClick={remindPendingGuests}><MessageCircle size={16} /> Send RSVP reminder</button></div>
        <div className={styles.inviteSummary}><div className={styles.miniInvite}><span>{invitation ? invitation.eventType.toUpperCase() : "THE WEDDING OF"}</span><strong>{hostName}</strong><small>{invitation ? `${invitation.date} · ${invitation.venue}` : "30 OCTOBER 2026 · DHANA MAHAL"}</small></div><div className={styles.summaryCopy}><span className={styles.live}><i /> LIVE INVITATION</span><h2>{hostName}</h2><p>{invitation ? `${invitation.eventType} · ${invitation.template}` : "Wedding · Elegant Gold"}</p><div className={styles.summaryMeta}><span><CalendarDays size={15} /> {invitation?.date || "30 October 2026"}</span><span><Users size={15} /> {totalSeats} guests</span><span><MapPin size={15} /> {invitation?.venue || "Mayiladuthurai"}</span></div><div className={styles.summaryActions}><Link href={`/invite/${activeSlug}`} target="_blank">View invite <ArrowUpRight size={14} /></Link><button onClick={exportGuestList}><Download size={14} /> Export guest list</button></div></div><div className={styles.countdown}><small>COUNTDOWN</small><strong>04 <i>days</i></strong><span>until the big day</span></div></div>
        <div className={styles.statGrid}><div><span>Total guests</span><strong>{totalSeats}</strong><small><Users size={13} /> {guests.length} guest entries</small></div><div><span>Confirmed</span><strong>{confirmedSeats}</strong><small className={styles.green}><Check size={13} /> Ready to celebrate</small></div><div><span>Pending replies</span><strong>{guests.filter((guest) => guest.status === "Pending").length}</strong><small className={styles.orange}><Send size={13} /> Need a reminder</small></div><div><span>Invitation views</span><strong>248</strong><small className={styles.green}><ArrowUpRight size={13} /> +18% this week</small></div></div>
        <div className={styles.columns}><div className={styles.panel} id="guests"><div className={styles.panelHead}><div><div className={styles.kicker}>GUEST MANAGEMENT</div><h2>Guest list</h2></div><div className={styles.panelTools}><div className={styles.filters}>{["All guests", "Confirmed", "Maybe", "Declined", "Pending"].map((item) => <button key={item} className={filter === item ? styles.filterActive : ""} onClick={() => setFilter(item)}>{item}</button>)}</div><button className={styles.addGuest} onClick={() => setShowAdd(true)}><Plus size={14} /> Add guest</button></div></div><div className={styles.guestTable}><div className={`${styles.tableRow} ${styles.tableLabels}`}><span>Guest / group</span><span>Guests</span><span>Meal</span><span>Actions</span></div>{visibleGuests.map((guest) => <div className={styles.tableRow} key={`${guest.name}-${guest.phone}`}><span className={styles.guestName}><i>{guest.name.slice(0, 1)}</i><strong>{guest.name}<small>{guest.group} · {guest.phone}</small></strong></span><span>{guest.guests}</span><span>{guest.meal}</span><span className={styles.rowActions}><button className={guest.checkedIn ? styles.checked : styles.checkin} onClick={() => toggleCheckIn(guest)}>{guest.checkedIn ? <><Check size={12} /> Checked</> : "Check in"}</button><button className={styles.whatsapp} onClick={() => shareGuest(guest)} title={`Share with ${guest.name}`}><MessageCircle size={13} /></button><button className={styles.deleteGuest} onClick={() => removeGuest(guest)} title="Delete guest"><Trash2 size={13} /></button></span></div>)}</div></div>
          <div className={styles.sidePanels}><div className={styles.panel} id="schedule"><div className={styles.kicker}>THE WEEKEND</div><h2>Wedding schedule</h2><div className={styles.schedule}>{events.map((event) => <div key={`${event.day}-${event.name}`}><b>{event.day}</b><span><strong>{event.name}</strong><small>{event.details}</small></span></div>)}</div><button className={styles.addEvent} onClick={() => setShowEventForm(true)}><Plus size={14} /> Add event</button></div><div className={`${styles.panel} ${styles.qrPanel}`}><QrCode size={30} /><div><h3>Venue check-in</h3><p>Scan guests at the entrance with your host QR.</p><button onClick={() => setShowCheckIn(true)}>Open check-in <ArrowUpRight size={13} /></button></div></div></div></div>
        <label className={styles.importContacts}><Upload size={14} /> Import contact CSV<input type="file" accept=".csv,text/csv" onChange={importContacts} /></label>
        <RsvpPanel />
      </section>
    </div>
    {showAdd && <div className={styles.modalBackdrop}><form className={styles.addModal} onSubmit={addGuest}><button type="button" className={styles.modalClose} onClick={() => setShowAdd(false)}><X size={18} /></button><div className={styles.kicker}>NEW GUEST</div><h2>Add someone to your celebration</h2><p>We&apos;ll create a personal WhatsApp invite for them.</p><label>Full name<input autoFocus required value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} placeholder="Priya Menon" /></label><label>WhatsApp number<input required value={newGuest.phone} onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })} placeholder="+91 98765 43210" /></label><div className={styles.formTwo}><label>Group<select value={newGuest.group} onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })}><option>Friends</option><option>Bride family</option><option>Groom family</option><option>VIP</option></select></label><label>Guests<select value={newGuest.guests} onChange={(e) => setNewGuest({ ...newGuest, guests: e.target.value })}><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option></select></label></div><label>Meal preference<select value={newGuest.meal} onChange={(e) => setNewGuest({ ...newGuest, meal: e.target.value })}><option>Vegetarian</option><option>Non-vegetarian</option><option>Jain</option><option>Mixed</option></select></label><button className={styles.saveGuest} type="submit"><Plus size={15} /> Add guest</button></form></div>}
    {showCheckIn && <div className={styles.modalBackdrop}><div className={styles.addModal}><button className={styles.modalClose} onClick={() => setShowCheckIn(false)}><X size={18} /></button><div className={styles.kicker}>VENUE CHECK-IN</div><h2>Check guests in</h2><p>Use the check-in buttons below as guests arrive.</p>{guests.map((guest) => <button key={guest.phone} className={guest.checkedIn ? styles.checked : styles.checkin} onClick={() => toggleCheckIn(guest)}>{guest.checkedIn ? "✓ " : ""}{guest.name}</button>)}</div></div>}
    {pendingRemoval && <div className={styles.modalBackdrop}><div className={styles.addModal} role="dialog" aria-modal="true" aria-labelledby="remove-guest-title"><button className={styles.modalClose} onClick={() => setPendingRemoval(null)}><X size={18} /></button><div className={styles.kicker}>REMOVE GUEST</div><h2 id="remove-guest-title">Remove {pendingRemoval.name}?</h2><p>This only removes the guest from this dashboard.</p><div className={styles.formTwo}><button type="button" onClick={() => setPendingRemoval(null)}>Keep guest</button><button type="button" className={styles.saveGuest} onClick={confirmRemoveGuest}>Remove</button></div></div></div>}
    {showEventForm && <div className={styles.modalBackdrop}><form className={styles.addModal} onSubmit={addEvent} role="dialog" aria-modal="true" aria-labelledby="event-form-title"><button type="button" className={styles.modalClose} onClick={() => setShowEventForm(false)}><X size={18} /></button><div className={styles.kicker}>SCHEDULE</div><h2 id="event-form-title">Add an event</h2><label>Event name<input autoFocus required value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="Reception" /></label><label>Date, time and venue<input required value={newEvent.details} onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })} placeholder="31 · 6:00 PM · Venue" /></label><button className={styles.saveGuest} type="submit"><Plus size={15} /> Add event</button></form></div>}
  </main>;
}

function HostSummary({ invitation }: { invitation: HostInvitation | null }) {
  if (!invitation) return <section className={styles.actualSummary}><strong>No invitation published yet.</strong><Link href="/">Create your invitation</Link></section>;
  const title = invitation.eventType === "Birthday" ? invitation.firstName : `${invitation.firstName} & ${invitation.secondName}`;
  return <section className={styles.actualSummary}><div><small>LIVE INVITATION</small><h2>{title}</h2><p>{invitation.eventType} · {invitation.template}</p></div><div><small>SHARE LINK</small><code>/invite/{invitation.slug}</code><span>{invitation.views} views</span></div><Link href={`/invite/${invitation.slug}`}>View invite <ArrowUpRight size={14} /></Link></section>;
}

type RsvpRow = { id: string; name: string; guest_count: number; response: string; event_name?: string | null; message: string; created_at: string; invitations?: { slug: string; first_name: string; second_name: string | null } | null };

function RsvpPanel() {
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/rsvps").then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "Could not load RSVPs."); setRsvps(body); }).catch((reason: Error) => setError(reason.message));
  }, []);
  return <section className={`${styles.rsvpPanel} ${styles.panel}`} id="rsvps">
    <div className={styles.rsvpHeader}><div><div className={styles.kicker}>REPLIES</div><h2>RSVP responses</h2><p className={styles.rsvpSubtitle}>A live view of everyone who has responded.</p></div><div className={styles.rsvpSummary}><strong>{rsvps.length}</strong><span>received</span></div></div>
    {error ? <div className={styles.rsvpEmpty}><span>!</span><p>{error}</p></div> : rsvps.length === 0 ? <div className={styles.rsvpEmpty}><span>♡</span><p>No responses yet. New RSVPs will appear here.</p></div> : <div className={styles.rsvpList}>{rsvps.map((rsvp) => <article className={styles.rsvpCard} key={rsvp.id}><div className={styles.rsvpAvatar}>{rsvp.name.slice(0, 1).toUpperCase()}</div><div className={styles.rsvpMain}><div className={styles.rsvpCardTop}><div><strong>{rsvp.name}</strong><small>{new Date(rsvp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small></div><span className={`${styles.rsvpBadge} ${rsvp.response === "attending" ? styles.rsvpAttending : styles.rsvpMaybe}`}>{rsvp.response === "attending" ? "Attending" : rsvp.response}</span></div><div className={styles.rsvpMeta}><span>{rsvp.guest_count} {rsvp.guest_count === 1 ? "guest" : "guests"}</span><span>•</span><span>{rsvp.invitations?.first_name} {rsvp.invitations?.second_name ? `& ${rsvp.invitations.second_name}` : ""}</span></div>{rsvp.message && <p className={styles.rsvpMessage}>“{rsvp.message}”</p>}</div></article>)}</div>}
  </section>;
}
