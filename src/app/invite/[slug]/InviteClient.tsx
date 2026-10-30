"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { BarChart3, CalendarDays, Check, ChevronLeft, Download, FileSpreadsheet, Heart, MailOpen, MapPin, PhoneCall, Printer, Send, Share2, Sparkles, Upload, Users, Volume2, VolumeX } from "lucide-react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import styles from "./invite.module.css";
import ThreeCelebrationScene from "@/components/ThreeCelebrationScene";
import EnvelopeOpening from "@/components/EnvelopeOpening";

export type Invite = { eventType: string; firstName: string; secondName: string; age?: string; date: string; time: string; venue: string; address: string; maps: string; message: string; contact?: string; template?: string; coverPhotoUrl?: string; galleryUrls?: string[]; events?: InviteEvent[]; dressCode?: string; travelInfo?: string; musicUrl?: string; expiresAt?: number; views?: number; viewsByPlace?: Record<string, number> };
export type InviteEvent = { name: string; date: string; time: string; venue: string; address?: string };

function themeName(template = "Elegant Gold") {
  const norm = (template || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const map: Record<string, string> = {
    elegantgold: "elegantGold",
    royalindian: "royalIndian",
    modernivory: "modernIvory",
    gardenfloral: "gardenFloral",
    funbright: "funBright",
    midnightluxe: "midnightLuxe",
    minimaljoy: "minimalJoy",
  };
  return map[norm] || "elegantGold";
}

function formatPhone(phone?: string) {
  if (!phone) return "+91 98765 43210";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return phone.startsWith("+") ? phone : `+91 ${phone}`;
}
function waPhone(phone?: string) {
  if (!phone) return "919876543210";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}
function callPhone(phone?: string) {
  if (!phone) return "+919876543210";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

function dateLabel(date: string) { const value = new Date(`${date}T12:00:00`); return Number.isNaN(value.getTime()) ? "Date to be announced" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(value); }
function timeLabel(time: string) { const value = new Date(`2026-01-01T${time || "19:00"}`); return Number.isNaN(value.getTime()) ? "Time to be announced" : new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(value); }
function icsText(value: string) { return value.replace(/[\\,;\n]/g, (match) => match === "\n" ? "\\n" : `\\${match}`); }
function calendarValue(value: Date) { return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, ""); }

export default function InviteClient({ invite, slug }: { invite: Invite; slug: string }) {
  const searchParams = useSearchParams();
  const guestName = searchParams.get("g")?.trim() || "";
  const [shareUrl, setShareUrl] = useState("");
  const [showCover, setShowCover] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      return sessionStorage.getItem(`traxva_opened_${slug}`) !== "true";
    } catch {
      return true;
    }
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  function toggleMusic() {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  }
  const [showRsvp, setShowRsvp] = useState(false);
  const [sent, setSent] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [rsvp, setRsvp] = useState({ name: guestName, guestCount: "1", response: "attending", eventName: "", message: "" });
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, arrived: false });
  const [expired, setExpired] = useState(false);
  const [activeView, setActiveView] = useState<"guest" | "host">(
    searchParams.get("view") === "host" ? "host" : "guest"
  );
  const [showContactHost, setShowContactHost] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [hostTone, setHostTone] = useState<"warmth" | "formal" | "reminder">("warmth");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState("");
  const [hostStats, setHostStats] = useState({
    invited: 500,
    confirmed: 320,
    pending: 150,
    declined: 30,
    attendance: {
      engagement: 210,
      mehendi: 180,
      wedding: 300,
      reception: 450,
    },
  });
  const [downloading, setDownloading] = useState(false);
  const [showRsvpHint, setShowRsvpHint] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);

  async function downloadCard() {
    if (!exportCardRef.current && !cardRef.current) return;
    setDownloading(true);
    try {
      const target = exportCardRef.current || cardRef.current;
      if (!target) return;
      // Guarantee settled layout & fonts
      await new Promise((resolve) => setTimeout(resolve, 80));
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: false,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${slug}-invitation.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export card image", err);
      window.print();
    } finally {
      setDownloading(false);
    }
  }
  const displayName = invite.eventType === "Birthday" ? invite.firstName : `${invite.firstName} & ${invite.secondName}`;
  const isFamilyEvent = ["wedding", "engagement", "reception"].includes((invite.eventType || "").toLowerCase());
  const contactLabel = isFamilyEvent ? "Contact family" : "Get in touch";
  const theme = themeName(invite.template);
  const events = invite.events?.length ? invite.events : [{ name: invite.eventType, date: invite.date, time: invite.time, venue: invite.venue, address: invite.address }];
  const copy = {
    open: "Tap to open your invitation",
    invited: "YOU'RE INVITED",
    rsvp: "RSVP now",
    respond: "Will you join us?",
    save: "SAVE THE DATE",
    together: "Together with their families",
    date: "Date",
    time: "Time",
    venue: "Venue",
    directions: "Directions",
    calendar: "Add to calendar",
    yes: "Yes",
    maybe: "Maybe",
    no: "Can't come",
    name: "Your name",
    guests: "Number of guests",
    message: "Message",
    send: "Send RSVP",
  };
  useEffect(() => { const timer = window.setTimeout(() => setShareUrl(window.location.href), 0); return () => window.clearTimeout(timer); }, []);

  useEffect(() => {
    if (showCover || hintDismissed || showRsvp || sent) return;
    const timer = window.setTimeout(() => {
      setShowRsvpHint(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [showCover, hintDismissed, showRsvp, sent]);

  function dismissHint() {
    setShowRsvpHint(false);
    setHintDismissed(true);
  }

  function handleHintConfirm() {
    setShowRsvpHint(false);
    setHintDismissed(true);
    setShowRsvp(true);
  }

  useEffect(() => { const tick = () => { const difference = new Date(`${invite.date}T${invite.time || "19:00"}`).getTime() - Date.now(); setRemaining(difference <= 0 || Number.isNaN(difference) ? { days: 0, hours: 0, minutes: 0, seconds: 0, arrived: true } : { days: Math.floor(difference / 86400000), hours: Math.floor(difference / 3600000) % 24, minutes: Math.floor(difference / 60000) % 60, seconds: Math.floor(difference / 1000) % 60, arrived: false }); }; tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [invite.date, invite.time]);
  useEffect(() => { const timer = window.setTimeout(() => setExpired(Boolean(invite.expiresAt && invite.expiresAt < Date.now())), 0); return () => window.clearTimeout(timer); }, [invite.expiresAt]);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setRsvpError(""); const response = await fetch(`/api/invitations/${encodeURIComponent(slug)}/rsvp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...rsvp, eventName: rsvp.eventName || events[0]?.name }) }); if (!response.ok) { const body = await response.json(); setRsvpError(body.error || "Could not send RSVP."); return; } setSent(true); setConfetti(true); window.setTimeout(() => setConfetti(false), 2600);
    const count = Number(rsvp.guestCount) || 1;
    if (rsvp.response === "attending") {
      setHostStats((prev) => ({
        ...prev,
        confirmed: prev.confirmed + count,
        pending: Math.max(0, prev.pending - 1),
      }));
    } else if (rsvp.response === "declined") {
      setHostStats((prev) => ({
        ...prev,
        declined: prev.declined + 1,
        pending: Math.max(0, prev.pending - 1),
      }));
    } }
  function addToCalendar() { const eventsIcs = events.map((event, index) => { const start = new Date(`${event.date}T${event.time || "19:00"}`); const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); return ["BEGIN:VEVENT", `UID:invite7-${slug}-${index}@invite7.in`, `DTSTAMP:${calendarValue(new Date())}`, `DTSTART:${calendarValue(start)}`, `DTEND:${calendarValue(end)}`, `SUMMARY:${icsText(`${displayName} · ${event.name}`)}`, `LOCATION:${icsText(`${event.venue}, ${event.address || ""}`)}`, `DESCRIPTION:${icsText(invite.message)}`, "END:VEVENT"].join("\r\n"); }).join("\r\n"); const calendar = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invite7//Invitation//EN", eventsIcs, "END:VCALENDAR"].join("\r\n"); const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `${invite.firstName}-events.ics`; link.click(); URL.revokeObjectURL(url); }
  if (expired) return <main className={styles.expired}><div className={styles.expiredCard}><div className={styles.kicker}>INVITE7</div><h1>This invitation<br /><em>has expired.</em></h1><p>The invitation link is no longer active.</p><Link href="/">Create your own invitation <Send size={14} /></Link></div></main>;
  return <main className={styles.invitePage} data-theme={theme}>
    <ThreeCelebrationScene variant="ambient" speed={0.8} />
    {confetti && <div className={styles.confetti} aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div>}

    {invite.musicUrl && (
      <audio
        ref={audioRef}
        src={invite.musicUrl}
        preload="auto"
        loop
        onPlay={() => setIsPlayingMusic(true)}
        onPause={() => setIsPlayingMusic(false)}
      />
    )}

    {showCover && (
      <EnvelopeOpening
        invite={invite}
        slug={slug}
        guestName={guestName}
        theme={theme}
        onOpenComplete={() => {
          setShowCover(false);
          setConfetti(true);
          window.setTimeout(() => setConfetti(false), 2800);
          if (audioRef.current && invite.musicUrl) {
            audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
          }
        }}
        onSkip={() => {
          setShowCover(false);
          try {
            sessionStorage.setItem(`traxva_opened_${slug}`, "true");
          } catch {}
        }}
      />
    )}

    <div className={`${styles.petal} ${styles.petalOne}`}>✦</div><div className={`${styles.petal} ${styles.petalTwo}`}>✧</div><div className={`${styles.petal} ${styles.petalThree}`}>✦</div>
    <div className={styles.inviteBack}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "inherit" }}>
        <ChevronLeft size={15} />
        <Image src="/images/traxva-logo.png" alt="TRAXVA" width={78} height={22} style={{ objectFit: "contain", height: "18px", width: "auto" }} />
      </Link>
      <span><Sparkles size={13} /> {guestName ? `Dear ${guestName}` : "A moment worth sharing"}</span>
      <div className={styles.topActions}>
        <button
          type="button"
          className={styles.replayEnvelopeBtn}
          onClick={() => setShowCover(true)}
          title="Replay Envelope Opening Animation"
        >
          <MailOpen size={13} /> Replay envelope
        </button>
        <button type="button" className={styles.downloadTopBtn} onClick={downloadCard} disabled={downloading}>
          <Download size={13} /> {downloading ? "Saving..." : "Save card image"}
        </button>
        <button type="button" className={styles.printTopBtn} onClick={() => window.print()}>
          <Printer size={13} /> Print / PDF
        </button>
      </div>
    </div>
    <section className={styles.modernInvite} ref={cardRef}><div className={styles.modernStory} style={invite.coverPhotoUrl ? { backgroundImage: `linear-gradient(#263b33dd,#263b33dd),url(${invite.coverPhotoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}><div className={styles.storyBadge}><Sparkles size={14} /> {copy.save}</div><p className={styles.kicker}>{copy.invited}</p><p className={styles.together}>{copy.together}</p><h1>{displayName}</h1><p className={styles.inviteCopy}>{invite.eventType === "Birthday" ? `invite you to celebrate ${invite.age ? `their ${invite.age}th birthday` : "their birthday"}` : `joyfully invite you to celebrate their ${invite.eventType.toLowerCase()}`}</p><div className={styles.storyLine}><span /> {invite.date.split("-").reverse().join(" · ")} <span /></div><p className={styles.message}>{invite.message}</p><div className={styles.storyFooter}><span>A TRAXVA EXPERIENCE</span><span>01 / 01</span></div></div>
      <div className={styles.modernInfo}>
        <div className={styles.infoTop}>
          <span className={styles.live}>
            <i /> LIVE INVITATION
          </span>
        </div>

        <div className={styles.details}>
              <div><CalendarDays size={17} /><span><small>{copy.date}</small><strong>{dateLabel(invite.date)}</strong></span></div>
              <div><Heart size={17} /><span><small>{copy.time}</small><strong>{timeLabel(invite.time)}</strong></span></div>
              <div><MapPin size={17} /><span><small>{copy.venue}</small><strong>{invite.venue}</strong><small>{invite.address}</small></span></div>
            </div>
            
            <div className={styles.guestActionsGrid}>
              <button
                type="button"
                onClick={() => {
                  setShowRsvp(true);
                  setShowRsvpHint(false);
                  setHintDismissed(true);
                }}
                className={`${styles.guestBtn} ${styles.guestBtnPrimary} ${showRsvpHint ? styles.pulseGlow : ""}`}
              >
                <Heart size={14} /> Confirm Attendance (RSVP)
              </button>
              <a href={invite.maps || "https://maps.google.com"} target="_blank" rel="noreferrer" className={styles.guestBtn}>
                <MapPin size={13} /> Directions
              </a>
              <button type="button" onClick={addToCalendar} className={styles.guestBtn}>
                <CalendarDays size={13} /> Add to calendar
              </button>
              <button type="button" onClick={() => setShowContactHost(true)} className={`${styles.guestBtn} ${styles.guestBtnContact}`}>
                <PhoneCall size={13} /> {contactLabel}
              </button>
            </div>
            <p className={styles.rsvpExplainer}>
              ✍️ <strong>RSVP</strong> = Let the family know if you will be joining the celebration!
            </p>

            <div className={styles.modernCountdown}>
              <div>
                <small>COUNTING DOWN TO THE MOMENT</small>
                <strong>{remaining.arrived ? "Today is the day" : `${remaining.days} days to go`}</strong>
              </div>
              {!remaining.arrived && (
                <div className={styles.countdownUnits}>
                  <span>{String(remaining.hours).padStart(2, "0")}<small>hrs</small></span>
                  <span>{String(remaining.minutes).padStart(2, "0")}<small>min</small></span>
                  <span>{String(remaining.seconds).padStart(2, "0")}<small>sec</small></span>
                </div>
              )}
            </div>
      </div>
    </section>
    {events.length > 1 && <section className={styles.eventTimeline}><div className={styles.kicker}>THE CELEBRATION</div>{events.map((event) => <article key={`${event.name}-${event.date}`}><strong>{event.name}</strong><span>{dateLabel(event.date)} · {timeLabel(event.time)}</span><small>{event.venue}{event.address ? ` · ${event.address}` : ""}</small><button type="button" onClick={() => { setRsvp((current) => ({ ...current, eventName: event.name })); setShowRsvp(true); }}>RSVP for {event.name}</button></article>)}</section>}
    {invite.galleryUrls?.length ? (
      <section className={styles.gallery}>
        <div className={styles.galleryTitle}>
          <span className={styles.kicker}>GALLERY</span>
          <h3>Captured Moments</h3>
        </div>
        <div className={styles.galleryGrid}>
          {invite.galleryUrls.map((url, i) => (
            <Image key={i} src={url} alt="Invitation gallery" width={600} height={450} unoptimized />
          ))}
        </div>
      </section>
    ) : null}
    {(invite.dressCode || invite.travelInfo || invite.musicUrl) && <section className={styles.guestExtras}>{invite.dressCode && <article><strong>What to wear</strong><p>{invite.dressCode}</p></article>}{invite.travelInfo && <article><strong>Travel & stay</strong><p>{invite.travelInfo}</p></article>}{invite.musicUrl && <article><strong>Set the mood</strong><audio controls src={invite.musicUrl} /></article>}</section>}
    {shareUrl && (
      <section className={styles.qrPanel}>
        <Image src={`https://quickchart.io/qr?size=180&text=${encodeURIComponent(shareUrl)}`} alt="QR code for this invitation" width={180} height={180} unoptimized />
        <div>
          <strong>Share this invitation</strong>
          <small>Scan or share this link directly with family & friends.</small>
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2500);
              }}
            >
              <Share2 size={13} /> {copiedLink ? "Link copied! ✓" : "Copy link"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`You're warmly invited! View invitation: ${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: "#25D366",
                color: "#fff",
                padding: "12px 22px",
                borderRadius: "999px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none"
              }}
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </section>
    )}
    <div className={styles.inviteFooter}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
        <Image src="/images/traxva-logo.png" alt="TRAXVA" width={85} height={25} style={{ objectFit: "contain", height: "19px", width: "auto" }} />
        <span style={{ color: "#d5cec3" }}>|</span>
        <span style={{ fontSize: "10px", color: "#8c8275", letterSpacing: "0.5px", textTransform: "uppercase" }}>A Product by</span>
        <a href="https://eantrax.com" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center" }}>
          <Image src="/images/eantrax-logo.png" alt="Eantrax" width={70} height={10} style={{ objectFit: "contain", height: "11px", width: "auto" }} />
        </a>
      </div>
      <span>Made with feeling in India</span>
      <span>♥</span>
    </div>
    {showRsvp && (
      <div className={styles.rsvpOverlay} onClick={() => setShowRsvp(false)}>
        <div className={styles.rsvpCard} role="dialog" aria-modal="true" aria-labelledby="rsvp-title" onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} aria-label="Close RSVP" onClick={() => setShowRsvp(false)}>×</button>
          {sent ? (
            <div className={styles.sent}>
              <div><Check /></div>
              <h2>Thank you for letting us know.</h2>
              <p>Your RSVP has been sent to {displayName}.</p>
              <button onClick={() => setShowRsvp(false)}>Close</button>
            </div>
          ) : (
            <>
              <div className={styles.kicker}>KINDLY RESPOND</div>
              <h2 id="rsvp-title">{copy.respond}</h2>
              <div className={styles.responseChoices}>
                {[["attending", "Yes, attending"], ["maybe", "Maybe"], ["declined", "Can't attend"]].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={rsvp.response === value ? styles.responseSelected : ""}
                    onClick={() => setRsvp({ ...rsvp, response: value })}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <form onSubmit={submit}>
                <label>
                  {copy.name}
                  <input
                    required
                    value={rsvp.name}
                    onChange={(event) => setRsvp({ ...rsvp, name: event.target.value })}
                    placeholder="e.g. Priya & Rajesh"
                  />
                </label>
                <label>
                  Number of guests attending
                  <select
                    value={rsvp.guestCount}
                    onChange={(event) => setRsvp({ ...rsvp, guestCount: event.target.value })}
                  >
                    <option value="1">1 guest</option>
                    <option value="2">2 guests</option>
                    <option value="3">3 guests</option>
                    <option value="4">4 guests</option>
                    <option value="5">5+ guests</option>
                  </select>
                </label>
                <label>
                  Warm wishes & message for {displayName} <span className={styles.optionalTag}>(Optional)</span>
                  <textarea
                    value={rsvp.message}
                    onChange={(event) => setRsvp({ ...rsvp, message: event.target.value })}
                    placeholder="Write your wishes, blessings, or a note for the family here (e.g. Heartiest congratulations! So excited to celebrate with you all!)..."
                    rows={3}
                  />
                  <span className={styles.commentPromptHint}>
                    💡 Share a loving blessing, congratulatory note, or message for the hosts.
                  </span>
                </label>
                {rsvpError && <p className={styles.formError} role="alert">{rsvpError}</p>}
                <button type="submit">Confirm & Send RSVP <Send size={15} /></button>
              </form>
            </>
          )}
        </div>
      </div>
    )}

    {/* Contact Host Modal */}
    {showContactHost && (
      <div className={styles.rsvpOverlay} onClick={() => setShowContactHost(false)}>
        <div className={styles.rsvpCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} aria-label="Close" onClick={() => setShowContactHost(false)}>×</button>
          <div className={styles.kicker}>{isFamilyEvent ? "FAMILY CONTACT" : "GET IN TOUCH"}</div>
          <h2>{isFamilyEvent ? "Get in touch with the family" : `Get in touch with ${displayName}`}</h2>
          <p style={{ color: "#746f68", fontSize: "14px", lineHeight: "1.6", margin: "10px 0 20px" }}>
            {isFamilyEvent
              ? "Have questions about timings, venue directions, or accommodations? Reach out directly:"
              : "Have questions about the celebration or need directions? Reach out directly:"}
          </p>
          <div style={{ display: "grid", gap: "10px" }}>
            <a
              href={`https://wa.me/${waPhone(invite.contact)}?text=${encodeURIComponent(`Hello ${displayName}! I received your invitation and had a quick question:`)}`}
              target="_blank"
              rel="noreferrer"
              className={styles.contactBtn}
              style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}
            >
              <Share2 size={15} /> Chat on WhatsApp ({formatPhone(invite.contact)})
            </a>
            <a
              href={`tel:${callPhone(invite.contact)}`}
              className={styles.contactBtn}
              style={{ background: "var(--story-bg)", color: "var(--story-fg)", textDecoration: "none" }}
            >
              <PhoneCall size={15} /> {isFamilyEvent ? "Call Family" : "Call Host"} ({formatPhone(invite.contact)})
            </a>
          </div>
        </div>
      </div>
    )}

    {/* Guest Import (Excel/CSV) Modal */}
    {showImportModal && (
      <div className={styles.rsvpOverlay} onClick={() => setShowImportModal(false)}>
        <div className={styles.rsvpCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} aria-label="Close" onClick={() => setShowImportModal(false)}>×</button>
          <div className={styles.kicker}>GUEST IMPORT (EXCEL / CSV)</div>
          <h2>Import your guest list</h2>
          <p style={{ color: "#746f68", fontSize: "13px", lineHeight: "1.5", margin: "8px 0 16px" }}>
            Upload a .csv file or paste names with guest counts to instantly sync your invited headcount.
          </p>
          <div style={{ display: "grid", gap: "12px" }}>
            <label style={{ fontSize: "12px", color: "#666" }}>
              Paste guest names (one per line, e.g. "Vikram & Sunita, 2"):
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Vikram & Sunita, 2&#10;Deepak Verma, 1&#10;The Kapoor Family, 4"
                style={{ width: "100%", height: "100px", marginTop: "6px", padding: "10px", fontSize: "13px", border: "1px solid #d5cec2", borderRadius: "8px" }}
              />
            </label>
            <button
              type="button"
              className={styles.contactBtn}
              style={{ background: "var(--story-bg)", color: "#fff" }}
              onClick={() => {
                const lines = importText.split("\n").filter((l) => l.trim().length > 0);
                const count = lines.length || 10;
                setHostStats((prev) => ({
                  ...prev,
                  invited: prev.invited + count,
                  pending: prev.pending + count,
                }));
                setImportSuccess(`Imported ${count} new guests successfully!`);
                setTimeout(() => {
                  setImportSuccess("");
                  setShowImportModal(false);
                  setImportText("");
                }, 1400);
              }}
            >
              <Upload size={14} /> Process Import
            </button>
            {importSuccess && <p style={{ color: "#2e7d32", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>{importSuccess}</p>}
          </div>
        </div>
      </div>
    )}

    {/* WhatsApp Reminders & Broadcast Modal */}
    {showReminderModal && (
      <div className={styles.rsvpOverlay} onClick={() => setShowReminderModal(false)}>
        <div className={styles.rsvpCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
          <button className={styles.close} aria-label="Close" onClick={() => setShowReminderModal(false)}>×</button>
          <div className={styles.kicker}>AUTOMATED WHATSAPP SUITE</div>
          <h2>Send ceremony reminder</h2>
          <p style={{ color: "#746f68", fontSize: "12px", lineHeight: "1.4", margin: "6px 0 14px" }}>
            Select your tone, then broadcast to pending guests or trigger server delivery.
          </p>

          {/* Tone Selector */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setHostTone("warmth")}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid var(--accent)",
                background: hostTone === "warmth" ? "var(--story-bg)" : "transparent",
                color: hostTone === "warmth" ? "#fff" : "var(--ink)",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              💛 Family Warmth
            </button>
            <button
              type="button"
              onClick={() => setHostTone("formal")}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid var(--accent)",
                background: hostTone === "formal" ? "var(--story-bg)" : "transparent",
                color: hostTone === "formal" ? "#fff" : "var(--ink)",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              👑 Formal / Regal
            </button>
            <button
              type="button"
              onClick={() => setHostTone("reminder")}
              style={{
                padding: "6px 12px",
                borderRadius: "999px",
                border: "1px solid var(--accent)",
                background: hostTone === "reminder" ? "var(--story-bg)" : "transparent",
                color: hostTone === "reminder" ? "#fff" : "var(--ink)",
                fontSize: "11px",
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              ⏳ Last-Minute
            </button>
          </div>

          {/* Live Preview */}
          <div style={{ background: "#f5f0e6", padding: "12px 14px", borderRadius: "8px", fontSize: "12px", lineHeight: "1.5", color: "#333", border: "1px solid #e2d9c8", maxHeight: "110px", overflowY: "auto" }}>
            {hostTone === "formal" ? (
              <>
                Respected Guest,<br />
                We cordially request the honour of your esteemed presence to celebrate <strong>{displayName}</strong> on <strong>{dateLabel(invite.date)}</strong>.<br /><br />
                Personal invitation link:<br />
                <span style={{ color: "#a7553f", wordBreak: "break-all" }}>{shareUrl || `http://localhost:3000/invite/${slug}`}</span>
              </>
            ) : hostTone === "reminder" ? (
              <>
                Hi Guest! ⏳<br />
                Just a gentle reminder regarding <strong>{displayName}</strong> on <strong>{dateLabel(invite.date)}</strong> at <strong>{invite.venue}</strong>. We are finalizing seating and catering.<br /><br />
                Confirm your RSVP in 10 seconds:<br />
                <span style={{ color: "#a7553f", wordBreak: "break-all" }}>{shareUrl || `http://localhost:3000/invite/${slug}`}</span>
              </>
            ) : (
              <>
                Namaste! 🙏<br />
                Our celebration would truly be incomplete without you and your family! Join us for <strong>{displayName}</strong> on <strong>{dateLabel(invite.date)}</strong>.<br /><br />
                View your personal invitation:<br />
                <span style={{ color: "#a7553f", wordBreak: "break-all" }}>{shareUrl || `http://localhost:3000/invite/${slug}`}</span>
              </>
            )}
          </div>

          <div style={{ display: "grid", gap: "8px", marginTop: "14px" }}>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                hostTone === "formal"
                  ? `Respected Guest,\n\nWe cordially request the honour of your esteemed presence to celebrate ${displayName} on ${dateLabel(invite.date)} at ${invite.venue}.\n\nKindly confirm your attendance: ${shareUrl || `http://localhost:3000/invite/${slug}`}`
                  : hostTone === "reminder"
                  ? `Hi Guest! ⏳\n\nJust a gentle reminder regarding ${displayName} on ${dateLabel(invite.date)} at ${invite.venue}. Please confirm your attendance: ${shareUrl || `http://localhost:3000/invite/${slug}`}`
                  : `Namaste! 🙏\n\nOur celebration would truly be incomplete without you! Celebrate ${displayName} on ${dateLabel(invite.date)} at ${invite.venue}. RSVP here: ${shareUrl || `http://localhost:3000/invite/${slug}`}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className={styles.contactBtn}
              style={{ background: "#25D366", color: "#fff", textDecoration: "none" }}
            >
              <Share2 size={14} /> Open 1-Click WhatsApp Broadcast
            </a>

            <button
              type="button"
              className={styles.contactBtn}
              style={{ background: "var(--story-bg)", color: "#fff" }}
              disabled={broadcasting}
              onClick={async () => {
                setBroadcasting(true);
                setBroadcastFeedback("");
                try {
                  const res = await fetch("/api/whatsapp/broadcast", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      slug,
                      templateTone: hostTone,
                      recipients: [{ name: "Pending Guests", phone: "+919876543210" }],
                    }),
                  });
                  const d = await res.json();
                  if (res.ok) {
                    setBroadcastFeedback(`Sent via ${d.provider}!`);
                  } else {
                    setBroadcastFeedback(d.error || "Failed");
                  }
                } catch {
                  setBroadcastFeedback("Network error");
                } finally {
                  setBroadcasting(false);
                }
              }}
            >
              <Send size={14} /> {broadcasting ? "Triggering..." : "Trigger Cloud API Broadcast"}
            </button>
            {broadcastFeedback && (
              <small style={{ color: "#2e7d32", textAlign: "center", fontWeight: 600 }}>{broadcastFeedback}</small>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Hidden Container for Pristine Card Image Export (Zero Layout Shift, Zero Clipping) */}
    <div style={{ position: "fixed", top: 0, left: 0, width: 0, height: 0, overflow: "hidden", zIndex: -100, pointerEvents: "none" }}>
      <div
        ref={exportCardRef}
        className={styles.printableExportCard}
        data-theme={theme}
      >
        <div
          className={styles.exportStory}
          style={
            invite.coverPhotoUrl
              ? {
                  backgroundImage: `linear-gradient(#263b33dd,#263b33dd),url(${invite.coverPhotoUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className={styles.exportBadge}>
            <Sparkles size={12} /> {copy.save}
          </div>
          <p className={styles.exportKicker}>{copy.invited}</p>
          <p className={styles.exportTogether}>{copy.together}</p>
          <h1 className={styles.exportTitle}>{displayName}</h1>
          <p className={styles.exportCopy}>
            {invite.eventType === "Birthday"
              ? `invite you to celebrate ${invite.age ? `their ${invite.age}th birthday` : "their birthday"}`
              : `joyfully invite you to celebrate their ${invite.eventType.toLowerCase()}`}
          </p>
          <div className={styles.exportDateLine}>
            <span /> {invite.date.split("-").reverse().join(" · ")} <span />
          </div>
          <p className={styles.exportMessage}>{invite.message}</p>
          <div className={styles.exportFooter}>
            <span>A TRAXVA EXPERIENCE</span>
            <span>01 / 01</span>
          </div>
        </div>

        <div className={styles.exportInfo}>
          <div className={styles.exportInfoTop}>
            <span className={styles.exportKicker}>CELEBRATION DETAILS</span>
            <span className={styles.infoHeart}>♡</span>
          </div>

          <div className={styles.exportDetails}>
            <div className={styles.exportDetailItem}>
              <CalendarDays size={18} />
              <div>
                <small>{copy.date}</small>
                <strong>{dateLabel(invite.date)}</strong>
              </div>
            </div>
            <div className={styles.exportDetailItem}>
              <Heart size={18} />
              <div>
                <small>{copy.time}</small>
                <strong>{timeLabel(invite.time)}</strong>
              </div>
            </div>
            <div className={styles.exportDetailItem}>
              <MapPin size={18} />
              <div>
                <small>{copy.venue}</small>
                <strong>{invite.venue}</strong>
                <small>{invite.address}</small>
              </div>
            </div>
          </div>

          <div className={styles.exportGuestNote}>
            <p>“Kindly treat this as our personal invitation to celebrate with our family.”</p>
            <div className={styles.exportRsvpLine}>
              <span>RSVP & Info: <strong>{formatPhone(invite.contact)}</strong></span>
              {guestName && <small>Guest: <strong>{guestName}</strong></small>}
            </div>
          </div>

          <div className={styles.exportBottomRow}>
            <span>✦ ❖ ✦</span>
            <small>traxva.in · A Product by Eantrax</small>
          </div>
        </div>
      </div>
    </div>

    {/* 10-Second Floating RSVP Hint Banner */}
    {showRsvpHint && !showRsvp && !sent && (
      <motion.aside
        className={styles.rsvpHintBanner}
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        role="alert"
        aria-live="polite"
      >
        <div className={styles.hintContent}>
          <span className={styles.hintIcon} aria-hidden="true">💌</span>
          <div className={styles.hintText}>
            <strong>Will you be attending the celebration?</strong>
            <p>Please confirm your attendance (RSVP) so {displayName}&apos;s family can arrange heartfelt hospitality for you!</p>
          </div>
        </div>
        <div className={styles.hintActions}>
          <button
            type="button"
            className={styles.hintConfirmBtn}
            onClick={handleHintConfirm}
          >
            Confirm Attendance (RSVP)
          </button>
          <button
            type="button"
            className={styles.hintDismissBtn}
            onClick={dismissHint}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      </motion.aside>
    )}

    {invite.musicUrl && !showCover && (
      <button
        type="button"
        className={styles.floatingMusicBtn}
        onClick={toggleMusic}
        aria-label={isPlayingMusic ? "Mute music" : "Play music"}
        title={isPlayingMusic ? "Mute celebration music" : "Play celebration music"}
      >
        {isPlayingMusic ? <Volume2 size={15} /> : <VolumeX size={15} />}
        <span>{isPlayingMusic ? "Music on" : "Music off"}</span>
        {isPlayingMusic && (
          <span className={styles.musicBars} aria-hidden="true">
            <i /><i /><i />
          </span>
        )}
      </button>
    )}
  </main>;
}
