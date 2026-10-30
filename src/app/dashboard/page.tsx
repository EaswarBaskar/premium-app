"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CalendarDays, Check, CheckCheck, Clock, Download, Eye, Heart, MapPin, MessageCircle, PhoneCall, Plus, QrCode, RefreshCw, Send, Share2, Sparkles, Trash2, Upload, Users, X } from "lucide-react";
import baseStyles from "./dashboard.module.css";
import extraStyles from "./dashboardExtras.module.css";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/browser";
import BrandLogo from "@/components/BrandLogo";

const styles = { ...baseStyles, ...extraStyles };

type Guest = {
  name: string;
  guests: number;
  status: "Confirmed" | "Maybe" | "Declined" | "Pending";
  meal: string;
  group: string;
  phone: string;
  checkedIn: boolean;
  event?: string;
};

type HostInvitation = {
  slug: string;
  firstName: string;
  secondName?: string | null;
  eventType: string;
  date: string;
  time?: string;
  venue: string;
  address?: string;
  template: string;
  events?: { name: string; date?: string; time?: string; venue?: string }[];
  views: number;
  contact?: string | null;
};

type ScheduleEvent = { day: string; name: string; details: string };

type RsvpRow = {
  id: string;
  name: string;
  guest_count: number;
  response: string;
  event_name?: string | null;
  message: string;
  created_at: string;
  invitations?: { slug: string; first_name: string; second_name: string | null } | null;
};

export default function Dashboard() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);
  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [invitation, setInvitation] = useState<HostInvitation | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filter, setFilter] = useState("All guests");
  const [showAdd, setShowAdd] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<Guest | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [templateTone, setTemplateTone] = useState<"formal" | "warmth" | "reminder">("warmth");
  const [broadcastAudience, setBroadcastAudience] = useState<"pending" | "all">("pending");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [queueIndex, setQueueIndex] = useState(0);
  const [serverSending, setServerSending] = useState(false);
  const [serverResult, setServerResult] = useState<{ count: number; provider: string } | null>(null);
  const [showEditContact, setShowEditContact] = useState(false);
  const [hostContactInput, setHostContactInput] = useState("");
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [newGuest, setNewGuest] = useState({ name: "", phone: "", group: "Friends", guests: "1", meal: "Vegetarian" });
  const [newEvent, setNewEvent] = useState({ name: "", details: "" });
  const [feedback, setFeedback] = useState("");

  // 1. Auth Initialization
  useEffect(() => {
    try {
      // Clean up legacy mock guest list from early development
      window.localStorage.removeItem("invite7-guest-list");
    } catch {}

    if (!isSupabaseConfigured) {
      setAuthReady(true);
      setUserEmail("planner@invite7.in");
      return;
    }
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthReady(true);
        setUserEmail(data.user.email || "");
      } else {
        router.replace("/login?next=/dashboard");
      }
    }).catch(() => router.replace("/login?next=/dashboard"));
  }, [router]);

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.replace("/login");
  }

  // 2. Load the Host's Active Invitation & Data
  async function loadDashboardData(isRefresh = false) {
    if (!authReady) return;
    if (isRefresh) setRefreshing(true);
    else setLoadingInvitation(true);

    const searchSlug = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("slug") : null;
    const cachedSlug = typeof window !== "undefined" ? window.localStorage.getItem("invite7-active-invitation-slug") : null;
    const targetSlug = searchSlug || cachedSlug || "";

    try {
      const response = await fetch(`/api/invitations/mine${targetSlug ? `?slug=${encodeURIComponent(targetSlug)}` : ""}`);
      if (!response.ok) {
        setLoadingInvitation(false);
        setRefreshing(false);
        return;
      }
      const data = await response.json() as HostInvitation | null;
      if (data && data.slug) {
        setInvitation(data);
        try {
          window.localStorage.setItem("invite7-active-invitation-slug", data.slug);
        } catch {}

        // Initialize schedule events from invitation
        if (data.events && data.events.length > 0) {
          setEvents(data.events.map((e) => ({
            day: e.date ? String(new Date(e.date).getDate()) : "1",
            name: e.name,
            details: `${e.date || ""} · ${e.time || ""} · ${e.venue || ""}`,
          })));
        } else if (data.date) {
          const parsedDate = new Date(data.date);
          const dayNum = !isNaN(parsedDate.getDate()) ? String(parsedDate.getDate()) : "1";
          setEvents([{
            day: dayNum,
            name: `${data.eventType || "Event"} Celebration`,
            details: `${data.date} · ${data.time || ""} · ${data.venue || ""}`,
          }]);
        }

        // Load local manual guests saved for this celebration
        let localGuests: Guest[] = [];
        try {
          const saved = window.localStorage.getItem(`invite7-guests-${data.slug}`);
          if (saved) localGuests = JSON.parse(saved) as Guest[];
        } catch {}
        setGuests(localGuests);

        // Fetch verified RSVPs for THIS specific invitation
        const rsvpRes = await fetch(`/api/rsvps?slug=${encodeURIComponent(data.slug)}`);
        if (rsvpRes.ok) {
          const rows = await rsvpRes.json() as RsvpRow[];
          setGuests((current) => {
            const additions = rows
              .filter((rsvp) => !current.some((guest) => guest.phone === `rsvp:${rsvp.id}`))
              .map((rsvp) => ({
                name: rsvp.name,
                guests: rsvp.guest_count,
                status: rsvp.response === "attending" ? ("Confirmed" as const) : rsvp.response === "maybe" ? ("Maybe" as const) : rsvp.response === "declined" ? ("Declined" as const) : ("Pending" as const),
                meal: "Not specified",
                group: "RSVP response",
                event: rsvp.event_name || "All events",
                phone: `rsvp:${rsvp.id}`,
                checkedIn: false,
              }));
            return additions.length ? [...current, ...additions] : current;
          });
        }
      } else {
        setInvitation(null);
        setGuests([]);
        setEvents([]);
      }
    } catch {}

    setLoadingInvitation(false);
    setRefreshing(false);
    if (isRefresh) {
      setRefreshTrigger((prev) => prev + 1);
      setFeedback("Live RSVPs and visitor stats refreshed!");
      setTimeout(() => setFeedback(""), 2600);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [authReady]);

  function refreshData() {
    loadDashboardData(true);
  }

  // 3. Persist manual guest additions keyed by invitation slug
  useEffect(() => {
    if (invitation?.slug) {
      const manualOnly = guests.filter((g) => !g.phone.startsWith("rsvp:"));
      try {
        window.localStorage.setItem(`invite7-guests-${invitation.slug}`, JSON.stringify(manualOnly));
      } catch {}
    }
  }, [guests, invitation?.slug]);

  // Derived calculations
  const totalSeats = guests.reduce((sum, guest) => sum + guest.guests, 0);
  const confirmedSeats = guests.filter((guest) => guest.status === "Confirmed").reduce((sum, guest) => sum + guest.guests, 0);
  const visibleGuests = useMemo(() => filter === "All guests" ? guests : guests.filter((guest) => guest.status === filter), [filter, guests]);

  const countdownDays = useMemo(() => {
    if (!invitation?.date) return null;
    const evtTime = new Date(invitation.date).getTime();
    if (isNaN(evtTime)) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return Math.ceil((evtTime - now.getTime()) / 86400000);
  }, [invitation?.date]);

  function getTemplateMessage(guest: Guest, tone: "formal" | "warmth" | "reminder") {
    const slug = invitation?.slug || "";
    const title = invitation ? `${invitation.firstName}${invitation.secondName ? ` & ${invitation.secondName}` : ""}` : "our celebration";
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${slug}?g=${encodeURIComponent(guest.name)}`;
    if (tone === "formal") {
      return `Respected ${guest.name},\n\nWe cordially request the honour of your esteemed presence to celebrate ${title}.\n\nKindly confirm your attendance using your personal invitation link:\n${link}\n\nWarm regards,\nThe Family`;
    }
    if (tone === "reminder") {
      return `Hi ${guest.name}! ⏳\n\nJust a gentle reminder regarding ${title}! We are currently finalizing seating & catering arrangements.\n\nPlease confirm your RSVP in 10 seconds here:\n${link}\n\nLooking forward to seeing you!`;
    }
    return `Namaste ${guest.name}! 🙏\n\nOur celebration of ${title} would truly be incomplete without you and your family!\n\nView your invitation and let us know if you can join us:\n${link}\n\nWith love & best wishes!`;
  }

  const activeList = broadcastAudience === "all" ? guests : guests.filter((g) => g.status === "Pending");

  function addQuickGuest(e: FormEvent) {
    e.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) return;
    const newG: Guest = {
      name: quickName.trim(),
      phone: quickPhone.trim(),
      guests: 1,
      meal: "Vegetarian",
      group: "Friends",
      status: "Pending",
      checkedIn: false,
    };
    setGuests((current) => [...current, newG]);
    setQuickName("");
    setQuickPhone("");
    setFeedback(`Added ${newG.name} to guest list!`);
  }

  function sendQueueCurrent() {
    if (!activeList[queueIndex]) return;
    const guest = activeList[queueIndex];
    const msg = getTemplateMessage(guest, templateTone);
    window.open(`https://wa.me/${guest.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    if (queueIndex < activeList.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else {
      setFeedback("Completed WhatsApp Queue for all pending guests!");
      setShowBroadcast(false);
    }
  }

  async function triggerServerBroadcast() {
    if (!activeList.length || !invitation) return;
    setServerSending(true);
    setServerResult(null);
    try {
      const response = await fetch("/api/whatsapp/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: invitation.slug,
          templateTone,
          recipients: activeList.map((g) => ({ name: g.name, phone: g.phone, guests: g.guests })),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setServerResult({ count: data.successfulCount || activeList.length, provider: data.provider });
        setFeedback(`Broadcast sent to ${data.successfulCount} guests via ${data.provider}!`);
      } else {
        alert(data.error || "Failed to trigger broadcast.");
      }
    } catch {
      alert("Network error sending broadcast.");
    } finally {
      setServerSending(false);
    }
  }

  function shareGuest(guest: Guest) {
    if (!invitation) return;
    const slug = invitation.slug;
    const title = `${invitation.firstName}${invitation.secondName ? ` & ${invitation.secondName}` : ""}`;
    const link = `${window.location.origin}/invite/${slug}?g=${encodeURIComponent(guest.name)}`;
    const message = `Hi ${guest.name}, you’re warmly invited to celebrate ${title}. View your invitation: ${link}`;
    window.open(`https://wa.me/${guest.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function addGuest(e: FormEvent) {
    e.preventDefault();
    if (!newGuest.name.trim() || !newGuest.phone.trim()) return;
    setGuests((current) => [
      ...current,
      {
        ...newGuest,
        name: newGuest.name.trim(),
        phone: newGuest.phone.trim(),
        guests: Number(newGuest.guests),
        status: "Pending",
        checkedIn: false,
      },
    ]);
    setNewGuest({ name: "", phone: "", group: "Friends", guests: "1", meal: "Vegetarian" });
    setShowAdd(false);
    setFeedback(`Added ${newGuest.name.trim()} to guest list!`);
  }

  function removeGuest(guest: Guest) {
    setPendingRemoval(guest);
  }

  function confirmRemoveGuest() {
    if (pendingRemoval) {
      setGuests((current) => current.filter((item) => item !== pendingRemoval));
    }
    setPendingRemoval(null);
  }

  function toggleCheckIn(guest: Guest) {
    setGuests((current) => current.map((item) => item === guest ? { ...item, checkedIn: !item.checkedIn } : item));
  }

  function exportGuestList() {
    const rows = [
      ["Name", "Guests", "Status", "Meal", "Group", "Phone", "Checked in"],
      ...guests.map((guest) => [
        guest.name,
        guest.guests,
        guest.status,
        guest.meal,
        guest.group,
        guest.phone,
        guest.checkedIn ? "Yes" : "No",
      ]),
    ].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([rows], { type: "text/csv;charset=utf-8" }));
    link.download = `invite7-${invitation?.slug || "guest"}-list.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function addEvent(event: FormEvent) {
    event.preventDefault();
    if (!newEvent.name.trim() || !newEvent.details.trim()) return;
    setEvents((current) => [...current, { day: String(current.length + 1), name: newEvent.name.trim(), details: newEvent.details.trim() }]);
    setNewEvent({ name: "", details: "" });
    setShowEventForm(false);
  }

  async function importContacts(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setFeedback("Your CSV needs a header row and at least one contact.");
      return;
    }
    const headers = lines[0].split(",").map((header) => header.trim().toLowerCase());
    const value = (cells: string[], names: string[], fallback = "") => {
      const index = names.map((name) => headers.indexOf(name)).find((item) => item >= 0);
      return index === undefined ? fallback : (cells[index] || fallback).trim();
    };
    const imported = lines
      .slice(1)
      .map((line) => line.split(","))
      .map((cells) => ({
        name: value(cells, ["name", "full name", "contact"]),
        phone: value(cells, ["phone", "mobile", "whatsapp"]),
        group: value(cells, ["group", "category"], "Imported contacts"),
        guests: Number(value(cells, ["guests", "guest count"], "1")) || 1,
        meal: value(cells, ["meal", "meal preference"], "Not specified"),
        status: "Pending" as const,
        checkedIn: false,
      }))
      .filter((guest) => guest.name && guest.phone);
    setGuests((current) => [...current, ...imported.filter((guest) => !current.some((existing) => existing.phone === guest.phone))]);
    event.target.value = "";
    setFeedback(`${imported.length} contact${imported.length === 1 ? "" : "s"} imported.`);
  }

  if (!authReady || loadingInvitation) {
    return (
      <main className={styles.dashboard}>
        <div className={styles.authLoading}>Checking your celebration account…</div>
      </main>
    );
  }

  // If user has no invitation created or linked yet:
  if (!invitation) {
    return (
      <main className={styles.dashboard}>
        <header className={styles.header}>
          <BrandLogo href="/" variant="dashboard" />
          <div className={styles.headerRight}>
            <Link href="/" className={styles.signOutBtn} style={{ textDecoration: "none" }}>Create Invitation</Link>
            <button type="button" onClick={signOut} className={styles.signOutBtn}>Sign out</button>
            <div className={styles.avatar}>{userEmail ? userEmail.slice(0, 2).toUpperCase() : "AS"}</div>
          </div>
        </header>
        <div className={styles.emptyDashboard}>
          <div style={{ width: "56px", height: "56px", margin: "0 auto", borderRadius: "50%", background: "#f5e8e4", display: "grid", placeItems: "center" }}>
            <Sparkles size={28} color="#a7553f" />
          </div>
          <h2>Welcome to your Host Dashboard</h2>
          <p>
            You haven&apos;t created or linked an invitation yet. Design your digital invitation in under 2 minutes, and your live RSVPs, guest list, and WhatsApp reminders will automatically appear right here!
          </p>
          <Link href="/" className={styles.createBtn}>
            <Plus size={16} /> Create your invitation now
          </Link>
        </div>
      </main>
    );
  }

  const hostTitle = `${invitation.firstName}${invitation.secondName ? ` & ${invitation.secondName}` : ""}`;
  const activeSlug = invitation.slug;

  return (
    <main className={styles.dashboard}>
      {feedback && <p role="status" className={styles.feedback}>{feedback}</p>}
      <header className={styles.header}>
        <BrandLogo href="/" variant="dashboard" />
        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={refreshData}
            className={styles.refreshTopBtn}
            disabled={refreshing}
            title="Refresh live RSVPs and visitor count"
          >
            <RefreshCw size={12} className={refreshing ? styles.spinning : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <Link href={`/invite/${activeSlug}`} target="_blank">View invitation <ArrowUpRight size={15} /></Link>
          <button type="button" onClick={signOut} className={styles.signOutBtn}>Sign out</button>
          <div className={styles.avatar}>{userEmail ? userEmail.slice(0, 2).toUpperCase() : "AS"}</div>
        </div>
      </header>

      <div className={styles.layout}>
        <aside>
          <div className={styles.host}>
            <div className={styles.hostAvatar}>{hostTitle.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{hostTitle}</strong>
              <small>{userEmail || "Host account"}</small>
            </div>
          </div>
          <nav>
            <a className={styles.active} href="#overview">Overview</a>
            <a href="#guests">Guest list <b>{guests.length}</b></a>
            <a href="#schedule">{invitation.eventType} schedule</a>
            <a href="#rsvps">RSVP responses</a>
          </nav>
          <Link href="/" className={styles.create}><Plus size={15} /> New invitation</Link>
        </aside>

        <section className={styles.content}>
          {/* Mobile Quick Navigation Tabs */}
          <div className={styles.mobileNavTabs}>
            <a href="#overview">Overview</a>
            <a href="#guests">Guest list ({guests.length})</a>
            <a href="#schedule">{invitation.eventType} schedule</a>
            <a href="#rsvps">RSVPs</a>
          </div>

          <div className={styles.pageIntro} id="overview">
            <div>
              <div className={styles.kicker}>WELCOME BACK, {invitation.firstName.toUpperCase()}</div>
              <h1>Your celebration,<br /><em>beautifully organised.</em></h1>
            </div>
            <div className={styles.introActions}>
              <button
                type="button"
                className={styles.refreshMainBtn}
                onClick={refreshData}
                disabled={refreshing}
                title="Refresh live RSVPs and visitor count"
              >
                <RefreshCw size={14} className={refreshing ? styles.spinning : ""} />
                {refreshing ? "Updating live data..." : "Refresh live data"}
              </button>
              <button className={styles.reminder} onClick={() => { setQueueIndex(0); setServerResult(null); setShowBroadcast(true); }}>
                <MessageCircle size={16} /> Automated WhatsApp Broadcast &amp; Queue
              </button>
            </div>
          </div>

          {/* Real Live Invitation Meta */}
          <div className={styles.inviteSummary}>
            <div className={styles.miniInvite}>
              <span>{invitation.eventType.toUpperCase()}</span>
              <strong>{hostTitle}</strong>
              <small>{invitation.date} · {invitation.venue}</small>
            </div>
            <div className={styles.summaryCopy}>
              <span className={styles.live}><i /> LIVE INVITATION</span>
              <h2>{hostTitle}</h2>
              <p>{invitation.eventType} · {invitation.template}</p>
              <div className={styles.summaryMeta}>
                <span><CalendarDays size={15} /> {invitation.date}</span>
                <span><Users size={15} /> {totalSeats} guests</span>
                <span><MapPin size={15} /> {invitation.venue}</span>
                <span><PhoneCall size={15} /> {invitation.contact ? `+91 ${invitation.contact}` : "No contact set"}</span>
              </div>
              <div className={styles.summaryActions}>
                <Link href={`/invite/${activeSlug}`} target="_blank">View invite <ArrowUpRight size={14} /></Link>
                <button onClick={exportGuestList}><Download size={14} /> Export guest list</button>
                <button type="button" onClick={() => { setHostContactInput(invitation.contact || ""); setShowEditContact(true); }}>
                  <PhoneCall size={14} /> Edit host contact
                </button>
              </div>
            </div>
            <div className={styles.countdown}>
              <small>COUNTDOWN</small>
              <strong>{countdownDays !== null && countdownDays > 0 ? String(countdownDays).padStart(2, "0") : countdownDays === 0 ? "Today" : "—"} <i>{countdownDays !== null && countdownDays > 0 ? "days" : ""}</i></strong>
              <span>{countdownDays !== null && countdownDays > 0 ? "until the big day" : countdownDays === 0 ? "celebrating today!" : "celebration date"}</span>
            </div>
          </div>

          {/* Metric Stats */}
          <div className={styles.statGrid}>
            <div>
              <span>Total guests</span>
              <strong>{totalSeats}</strong>
              <small><Users size={13} /> {guests.length} guest entries</small>
            </div>
            <div>
              <span>Confirmed</span>
              <strong>{confirmedSeats}</strong>
              <small className={styles.green}><Check size={13} /> Ready to celebrate</small>
            </div>
            <div>
              <span>Pending replies</span>
              <strong>{guests.filter((guest) => guest.status === "Pending").length}</strong>
              <small className={styles.orange}><Send size={13} /> Need a reminder</small>
            </div>
            <div>
              <span>Invitation views</span>
              <strong>{invitation.views || 0}</strong>
              <small className={styles.green}><Eye size={13} /> Live visitor count</small>
            </div>
          </div>

          <div className={styles.columns}>
            {/* Guest Management Table */}
            <div className={styles.panel} id="guests">
              <div className={styles.panelHead}>
                <div>
                  <div className={styles.kicker}>GUEST MANAGEMENT</div>
                  <h2>Guest list</h2>
                </div>
                <div className={styles.panelTools}>
                  <div className={styles.filters}>
                    {["All guests", "Confirmed", "Maybe", "Declined", "Pending"].map((item) => (
                      <button key={item} className={filter === item ? styles.filterActive : ""} onClick={() => setFilter(item)}>
                        {item}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.refreshIconBtn}
                    onClick={refreshData}
                    disabled={refreshing}
                    title="Refresh live RSVPs and guest list"
                  >
                    <RefreshCw size={13} className={refreshing ? styles.spinning : ""} />
                  </button>
                  <button className={styles.addGuest} onClick={() => setShowAdd(true)}>
                    <Plus size={14} /> Add guest
                  </button>
                </div>
              </div>

              <div className={styles.guestTable}>
                <div className={`${styles.tableRow} ${styles.tableLabels}`}>
                  <span>Guest / group</span>
                  <span>Guests</span>
                  <span>Actions</span>
                </div>
                {visibleGuests.length === 0 ? (
                  <div className={styles.emptyGuestState}>
                    <Users size={28} color="#a7553f" />
                    <strong>No guests on your list yet</strong>
                    <small>Click &ldquo;+ Add guest&rdquo; above to add friends and family, or share your invitation link so guests can RSVP directly!</small>
                  </div>
                ) : (
                  visibleGuests.map((guest) => (
                    <div className={styles.tableRow} key={`${guest.name}-${guest.phone}`}>
                      <span className={styles.guestName}>
                        <i>{guest.name.slice(0, 1)}</i>
                        <strong>
                          {guest.name}
                          <small>{guest.group} · {guest.phone.startsWith("rsvp:") ? "Online RSVP" : guest.phone}</small>
                        </strong>
                      </span>
                      <span>{guest.guests}</span>
                      <span className={styles.rowActions}>
                        <button className={guest.checkedIn ? styles.checked : styles.checkin} onClick={() => toggleCheckIn(guest)}>
                          {guest.checkedIn ? <><Check size={12} /> Checked</> : "Check in"}
                        </button>
                        {!guest.phone.startsWith("rsvp:") && (
                          <button className={styles.whatsapp} onClick={() => shareGuest(guest)} title={`Share with ${guest.name}`}>
                            <MessageCircle size={13} />
                          </button>
                        )}
                        <button className={styles.deleteGuest} onClick={() => removeGuest(guest)} title="Delete guest">
                          <Trash2 size={13} />
                        </button>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Schedule & Venue QR Side Panels */}
            <div className={styles.sidePanels}>
              <div className={styles.panel} id="schedule">
                <div className={styles.kicker}>THE CELEBRATION</div>
                <h2>{invitation.eventType} schedule</h2>
                <div className={styles.schedule}>
                  {events.length === 0 ? (
                    <p style={{ color: "#8c857a", fontSize: "12px", padding: "12px 0" }}>No schedule items added yet.</p>
                  ) : (
                    events.map((event) => (
                      <div key={`${event.day}-${event.name}`}>
                        <b>{event.day}</b>
                        <span>
                          <strong>{event.name}</strong>
                          <small>{event.details}</small>
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button className={styles.addEvent} onClick={() => setShowEventForm(true)}>
                  <Plus size={14} /> Add event
                </button>
              </div>

              <div className={`${styles.panel} ${styles.qrPanel}`}>
                <QrCode size={30} />
                <div>
                  <h3>Venue check-in</h3>
                  <p>Scan guests at the entrance with your host QR.</p>
                  <button onClick={() => setShowCheckIn(true)}>Open check-in <ArrowUpRight size={13} /></button>
                </div>
              </div>
            </div>
          </div>

          <label className={styles.importContacts}>
            <Upload size={14} /> Import contact CSV
            <input type="file" accept=".csv,text/csv" onChange={importContacts} />
          </label>

          {/* Isolated RSVP Replies Panel */}
          <RsvpPanel slug={activeSlug} refreshTrigger={refreshTrigger} />
        </section>
      </div>

      {/* Add Guest Modal */}
      {showAdd && (
        <div className={styles.modalBackdrop}>
          <form className={styles.addModal} onSubmit={addGuest}>
            <button type="button" className={styles.modalClose} onClick={() => setShowAdd(false)}>
              <X size={18} />
            </button>
            <div className={styles.kicker}>NEW GUEST</div>
            <h2>Add someone to your celebration</h2>
            <p>We&apos;ll create a personal WhatsApp invite for them.</p>
            <label>
              Full name
              <input autoFocus required value={newGuest.name} onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })} placeholder="Priya Menon" />
            </label>
            <label>
              WhatsApp number <span>(10-digit mobile)</span>
              <input
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={newGuest.phone}
                onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                placeholder="9876543210"
              />
            </label>
            <div className={styles.formTwo}>
              <label>
                Group
                <select value={newGuest.group} onChange={(e) => setNewGuest({ ...newGuest, group: e.target.value })}>
                  <option>Friends</option>
                  <option>Family</option>
                  <option>Colleagues</option>
                  <option>VIP</option>
                </select>
              </label>
              <label>
                Guests
                <select value={newGuest.guests} onChange={(e) => setNewGuest({ ...newGuest, guests: e.target.value })}>
                  <option value="1">1 guest</option>
                  <option value="2">2 guests</option>
                  <option value="3">3 guests</option>
                  <option value="4">4 guests</option>
                </select>
              </label>
            </div>
            <button className={styles.saveGuest} type="submit"><Plus size={15} /> Add guest</button>
          </form>
        </div>
      )}

      {/* Check In Modal */}
      {showCheckIn && (
        <div className={styles.modalBackdrop}>
          <div className={styles.addModal}>
            <button className={styles.modalClose} onClick={() => setShowCheckIn(false)}><X size={18} /></button>
            <div className={styles.kicker}>VENUE CHECK-IN</div>
            <h2>Check guests in</h2>
            <p>Use the check-in buttons below as guests arrive.</p>
            {guests.length === 0 ? (
              <p style={{ color: "#8c857a", fontSize: "12px", padding: "12px 0" }}>No guests on list to check in yet.</p>
            ) : (
              guests.map((guest) => (
                <button key={guest.phone} className={guest.checkedIn ? styles.checked : styles.checkin} onClick={() => toggleCheckIn(guest)}>
                  {guest.checkedIn ? "✓ " : ""}{guest.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Remove Guest Confirmation */}
      {pendingRemoval && (
        <div className={styles.modalBackdrop}>
          <div className={styles.addModal} role="dialog" aria-modal="true" aria-labelledby="remove-guest-title">
            <button className={styles.modalClose} onClick={() => setPendingRemoval(null)}><X size={18} /></button>
            <div className={styles.kicker}>REMOVE GUEST</div>
            <h2 id="remove-guest-title">Remove {pendingRemoval.name}?</h2>
            <p>This only removes the guest from this dashboard.</p>
            <div className={styles.formTwo}>
              <button type="button" onClick={() => setPendingRemoval(null)}>Keep guest</button>
              <button type="button" className={styles.saveGuest} onClick={confirmRemoveGuest}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Schedule Event Modal */}
      {showEventForm && (
        <div className={styles.modalBackdrop}>
          <form className={styles.addModal} onSubmit={addEvent} role="dialog" aria-modal="true" aria-labelledby="event-form-title">
            <button type="button" className={styles.modalClose} onClick={() => setShowEventForm(false)}><X size={18} /></button>
            <div className={styles.kicker}>SCHEDULE</div>
            <h2 id="event-form-title">Add celebration event</h2>
            <label>
              Event name
              <input autoFocus required value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} placeholder="Reception" />
            </label>
            <label>
              Date, time and venue
              <input required value={newEvent.details} onChange={(e) => setNewEvent({ ...newEvent, details: e.target.value })} placeholder="31 · 6:00 PM · Grand Hall" />
            </label>
            <button className={styles.saveGuest} type="submit"><Plus size={15} /> Add event</button>
          </form>
        </div>
      )}

      {/* Edit Host Contact Modal */}
      {showEditContact && (
        <div className={styles.modalBackdrop}>
          <form
            className={styles.addModal}
            onSubmit={async (e) => {
              e.preventDefault();
              const contactVal = hostContactInput.trim();
              if (!contactVal) return;
              try {
                const res = await fetch(`/api/invitations/${activeSlug}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ contact: contactVal }),
                });
                if (res.ok) {
                  setInvitation((prev) => prev ? { ...prev, contact: contactVal } : null);
                  setFeedback(`Updated host contact to +91 ${contactVal}!`);
                  setShowEditContact(false);
                }
              } catch {
                alert("Failed to update contact number.");
              }
            }}
          >
            <button type="button" className={styles.modalClose} onClick={() => setShowEditContact(false)}>
              <X size={18} />
            </button>
            <div className={styles.kicker}>HOST CONTACT SETTINGS</div>
            <h2>Host Contact Number</h2>
            <p>This number is used when guests tap &ldquo;Contact host&rdquo; or WhatsApp the family on your invitation.</p>
            <label>
              WhatsApp / Phone Number <span>(10-digit mobile number)</span>
              <input
                autoFocus
                required
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                value={hostContactInput}
                onChange={(e) => setHostContactInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
              />
            </label>
            <button className={styles.saveGuest} type="submit">
              Save Contact Number
            </button>
          </form>
        </div>
      )}

      {/* WhatsApp Broadcast Suite Modal */}
      {showBroadcast && (
        <div className={styles.modalBackdrop}>
          <div className={styles.broadcastModal}>
            <button type="button" className={styles.modalClose} onClick={() => setShowBroadcast(false)}>
              <X size={18} />
            </button>

            <div className={styles.kicker}>AUTOMATED WHATSAPP SUITE</div>
            <h2>WhatsApp Broadcast &amp; Reminders</h2>
            <p>Send personalized invitation links directly to pending guests via Queue or Cloud API.</p>

            <div className={styles.broadcastControlsRow}>
              <div className={styles.toneSection}>
                <small>TARGET AUDIENCE</small>
                <div className={styles.tonePills}>
                  <button
                    type="button"
                    className={broadcastAudience === "pending" ? styles.toneActive : styles.toneBtn}
                    onClick={() => { setBroadcastAudience("pending"); setQueueIndex(0); }}
                  >
                    ⏳ Pending Guests Only ({guests.filter((g) => g.status === "Pending").length})
                  </button>
                  <button
                    type="button"
                    className={broadcastAudience === "all" ? styles.toneActive : styles.toneBtn}
                    onClick={() => { setBroadcastAudience("all"); setQueueIndex(0); }}
                  >
                    👥 All Guests ({guests.length})
                  </button>
                </div>
              </div>

              <div className={styles.toneSection}>
                <small>MESSAGE TONE</small>
                <div className={styles.tonePills}>
                  <button
                    type="button"
                    className={templateTone === "warmth" ? styles.toneActive : styles.toneBtn}
                    onClick={() => setTemplateTone("warmth")}
                  >
                    <Heart size={13} /> Family Warmth
                  </button>
                  <button
                    type="button"
                    className={templateTone === "formal" ? styles.toneActive : styles.toneBtn}
                    onClick={() => setTemplateTone("formal")}
                  >
                    <Sparkles size={13} /> Formal / Regal
                  </button>
                  <button
                    type="button"
                    className={templateTone === "reminder" ? styles.toneActive : styles.toneBtn}
                    onClick={() => setTemplateTone("reminder")}
                  >
                    <Clock size={13} /> Last-Minute Reminder
                  </button>
                </div>
              </div>
            </div>

            <form className={styles.quickAddRow} onSubmit={addQuickGuest}>
              <input
                required
                placeholder="Guest Name (e.g. Rahul Sharma)"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className={styles.quickInput}
              />
              <input
                required
                placeholder="WhatsApp No (10 digits)"
                value={quickPhone}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => setQuickPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={styles.quickInput}
              />
              <button type="submit" className={styles.quickAddBtn}>
                <Plus size={14} /> Add to Queue
              </button>
            </form>

            <div className={styles.broadcastPreviewBox}>
              <div className={styles.previewHeader}>
                <span>PREVIEW FOR: <strong>{activeList[queueIndex]?.name || "Guest Name"}</strong> ({activeList[queueIndex]?.phone || "+91 98765 00000"})</span>
                <small>{activeList.length} Pending Total</small>
              </div>
              <pre className={styles.previewText}>
                {activeList[queueIndex] ? getTemplateMessage(activeList[queueIndex], templateTone) : "No pending guests found on your list!"}
              </pre>
            </div>

            <div className={styles.sendingModes}>
              <div className={styles.modeCard}>
                <div className={styles.modeHead}>
                  <strong>1. Bulk WhatsApp Queue</strong>
                  <small>Opens WhatsApp sequentially (100% free, zero popup blocks)</small>
                </div>
                <div className={styles.queueProgress}>
                  <span>Queue: Guest {activeList.length > 0 ? queueIndex + 1 : 0} of {activeList.length}</span>
                  <div className={styles.queueBar}>
                    <div style={{ width: activeList.length ? `${((queueIndex + 1) / activeList.length) * 100}%` : "0%" }} />
                  </div>
                </div>
                <div className={styles.queueBtns}>
                  <button
                    type="button"
                    className={styles.queueSendBtn}
                    onClick={sendQueueCurrent}
                    disabled={!activeList.length}
                  >
                    <Share2 size={13} /> Send to {activeList[queueIndex]?.name || "Next"} &amp; Advance
                  </button>
                  {queueIndex < activeList.length - 1 && (
                    <button
                      type="button"
                      className={styles.queueSkipBtn}
                      onClick={() => setQueueIndex(queueIndex + 1)}
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.modeCard}>
                <div className={styles.modeHead}>
                  <strong>2. Cloud API Automated Broadcast</strong>
                  <small>Sends all {activeList.length} pending guests in background via Meta / Twilio</small>
                </div>
                <button
                  type="button"
                  className={styles.serverBroadcastBtn}
                  onClick={triggerServerBroadcast}
                  disabled={serverSending || !activeList.length}
                >
                  <Send size={13} /> {serverSending ? "Broadcasting..." : `1-Tap Server Broadcast (${activeList.length} guests)`}
                </button>
                {serverResult && (
                  <p className={styles.serverSuccessTag}>
                    <CheckCheck size={13} /> Delivered to {serverResult.count} guests via {serverResult.provider}!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function RsvpPanel({ slug, refreshTrigger }: { slug?: string; refreshTrigger?: number }) {
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/rsvps?slug=${encodeURIComponent(slug)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load RSVPs.");
        setRsvps(Array.isArray(body) ? body : []);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [slug, refreshTrigger]);

  return (
    <section className={`${styles.rsvpPanel} ${styles.panel}`} id="rsvps">
      <div className={styles.rsvpHeader}>
        <div>
          <div className={styles.kicker}>REPLIES</div>
          <h2>RSVP responses</h2>
          <p className={styles.rsvpSubtitle}>A live view of everyone who has responded to this invitation.</p>
        </div>
        <div className={styles.rsvpSummary}>
          <strong>{rsvps.length}</strong>
          <span>received</span>
        </div>
      </div>
      {error ? (
        <div className={styles.rsvpEmpty}>
          <span>!</span>
          <p>{error}</p>
        </div>
      ) : rsvps.length === 0 ? (
        <div className={styles.rsvpEmpty}>
          <span>♡</span>
          <p>No responses yet. When guests RSVP to your invitation link, they will appear here in real time.</p>
        </div>
      ) : (
        <div className={styles.rsvpList}>
          {rsvps.map((rsvp) => (
            <article className={styles.rsvpCard} key={rsvp.id}>
              <div className={styles.rsvpAvatar}>{rsvp.name.slice(0, 1).toUpperCase()}</div>
              <div className={styles.rsvpMain}>
                <div className={styles.rsvpCardTop}>
                  <div>
                    <strong>{rsvp.name}</strong>
                    <small>{new Date(rsvp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</small>
                  </div>
                  <span className={`${styles.rsvpBadge} ${rsvp.response === "attending" ? styles.rsvpAttending : styles.rsvpMaybe}`}>
                    {rsvp.response === "attending" ? "Attending" : rsvp.response}
                  </span>
                </div>
                <div className={styles.rsvpMeta}>
                  <span>{rsvp.guest_count} {rsvp.guest_count === 1 ? "guest" : "guests"}</span>
                  {rsvp.event_name && (
                    <>
                      <span>•</span>
                      <span>{rsvp.event_name}</span>
                    </>
                  )}
                </div>
                {rsvp.message && <p className={styles.rsvpMessage}>“{rsvp.message}”</p>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
