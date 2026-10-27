"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ClipboardList,
  ExternalLink,
  Heart,
  Link2,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import styles from "./page.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type EventType = "Wedding" | "Engagement" | "Birthday" | "Reception" | "Baby Shower" | "Other";
type FormData = { eventType: EventType; firstName: string; secondName: string; date: string; time: string; venue: string; address: string; maps: string; message: string; contact: string; age: string; template: string; coverPhotoUrl: string; galleryUrls: string[]; events: { name: string; date: string; time: string; venue: string; address: string; maps?: string }[]; dressCode: string; travelInfo: string; musicUrl: string };

const eventTypes: { name: EventType; icon: string; copy: string }[] = [
  { name: "Wedding", icon: "✦", copy: "For the beginning of forever" },
  { name: "Engagement", icon: "♡", copy: "A beautiful promise" },
  { name: "Birthday", icon: "✺", copy: "Make their day unforgettable" },
  { name: "Reception", icon: "❋", copy: "Celebrate together" },
  { name: "Baby Shower", icon: "☼", copy: "A little love is on the way" },
  { name: "Other", icon: "✧", copy: "Your moment, your way" },
];

const initialForm: FormData = { eventType: "Wedding", firstName: "Arjun", secondName: "Priya", date: "2026-12-12", time: "19:00", venue: "The Courtyard, Jaipur", address: "12 Palace Road, Jaipur", maps: "https://maps.google.com", message: "We would love to celebrate this special day with you.", contact: "+91 98765 43210", age: "", template: "Elegant Gold", coverPhotoUrl: "", galleryUrls: [], events: [], dressCode: "", travelInfo: "", musicUrl: "" };

function prettyDate(value: string) {
  if (!value) return "12 December 2026";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function timeLabel(value: string) {
  if (!value) return "7:00 PM";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${value}`));
}
function invitationSlug(firstName: string, secondName: string) {
  const clean = (value: string) => value.trim().replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return `${clean(firstName)}${clean(secondName)}` || "INVITATION";
}

function InvitationMock({ form, compact = false, onPhotoUpload }: { form: FormData; compact?: boolean; onPhotoUpload?: (file: File) => void }) {
  return <div className={`${styles.invitationMock} ${compact ? styles.compact : ""}`} data-theme={form.template.replace(/\s+/g, "").toLowerCase()}>
    <div className={styles.mockGlow} />
    <div className={styles.mockTopline}>INVITE7 · YOUR MOMENT, BEAUTIFULLY TOLD</div>
    <div className={styles.mockOrnament}>✦</div>
    <p className={styles.mockEyebrow}>You&apos;re invited</p>
    <p className={styles.mockTogether}>Together with their families</p>
    <h3>{form.firstName} <i>&amp;</i> {form.secondName}</h3>
    <p className={styles.mockCopy}>{form.eventType === "Wedding" ? "joyfully invite you to celebrate their wedding" : `invite you to celebrate their ${form.eventType.toLowerCase()}`}</p>
    <div className={styles.mockDivider}><span>✦</span></div>
    <strong>{prettyDate(form.date)}</strong>
    <span>{timeLabel(form.time)} · {form.venue}</span>
    {!compact && <div className={styles.mockActions}><button>Get directions</button><button>RSVP</button></div>}{onPhotoUpload && <label className={styles.photoUpload}>Add cover photo<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) onPhotoUpload(file); }} /></label>}
  </div>;
}

function getInitialPendingData(): { form?: FormData; template?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem("invite7-pending-invitation");
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function Home() {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(() => Boolean(getInitialPendingData()));
  const [mobileMenu, setMobileMenu] = useState(false);
  const [step, setStep] = useState(() => (getInitialPendingData() ? 4 : 1));
  const [form, setForm] = useState<FormData>(() => getInitialPendingData()?.form || initialForm);
  const [template, setTemplate] = useState(() => getInitialPendingData()?.template || "Elegant Gold");
  const plan = "starter";
  const [published, setPublished] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    createSupabaseBrowserClient().auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data.user));
    }).catch(() => setIsLoggedIn(false));
    try { localStorage.removeItem("invite7-pending-invitation"); } catch {}
  }, []);

  function selectTemplate(newTemplate: string) {
    setTemplate(newTemplate);
    setForm((current) => ({ ...current, template: newTemplate }));
  }

  const update = (key: keyof FormData, value: string) => setForm((current) => ({ ...current, [key]: value }));
  async function uploadPhoto(file: File) {
    const body = new FormData(); body.append("file", file);
    const response = await fetch("/api/uploads", { method: "POST", body });
    const result = await response.json();
    if (!response.ok) { setPublishError(result.error || "Could not upload the photo."); return; }
    setForm((current) => ({ ...current, coverPhotoUrl: result.url, galleryUrls: [...current.galleryUrls, result.url] }));
  }
  const templates = form.eventType === "Birthday" ? ["Fun & Bright", "Midnight Luxe", "Minimal Joy"] : ["Elegant Gold", "Royal Indian", "Modern Ivory", "Garden Floral"];
  const generatedSlug = useMemo(() => invitationSlug(form.firstName, form.secondName), [form.firstName, form.secondName]);
  const slug = publishedSlug || generatedSlug;
  const activeSlug = slug;
  const shareUrl = typeof window === "undefined" ? `https://invite7.in/invite/${activeSlug}` : `${window.location.origin}/invite/${activeSlug}`;
  const title = useMemo(() => form.eventType === "Birthday" ? `${form.firstName}'s birthday` : `${form.firstName} & ${form.secondName}'s ${form.eventType.toLowerCase()}`, [form]);

  async function publish() {
    if (!form.firstName.trim() || !form.date || !form.time || !form.venue.trim() || (form.eventType !== "Birthday" && !form.secondName.trim())) {
      setPublishError("Please complete the required name, date, time and venue fields before publishing.");
      return;
    }
    const response = await fetch("/api/invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, secondName: form.eventType === "Birthday" ? "" : form.secondName, template, plan }) });
    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        try { localStorage.setItem("invite7-pending-invitation", JSON.stringify({ form, template })); } catch {}
        setPublishError("Please sign in before publishing your invitation.");
        router.push("/login?next=/");
        return;
      }
      setPublishError(result.error || "Could not publish the invitation.");
      return;
    }
    setPublishError("");
    setPublishedSlug(result.slug);
    setPublished(true);
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return <main className={styles.siteShell}>{publishError && <p role="alert" className={styles.inlineError}>{publishError}</p>}
    <header className={styles.navbar}>
      <Link href="#top" className={styles.brand}><span>7</span> invite<span className={styles.brandDot}>.</span></Link>
      <nav className={`${styles.navLinks} ${mobileMenu ? styles.navOpen : ""}`}>
        <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a><a href="#templates" onClick={() => setMobileMenu(false)}>Templates</a><a href="#pricing" onClick={() => setMobileMenu(false)}>Pricing</a><a href="#faq" onClick={() => setMobileMenu(false)}>FAQ</a>
      </nav>
      <div className={styles.navActions}><button className={styles.login} onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login?next=/")}>{isLoggedIn ? "Dashboard" : "Log in"}</button><button className={styles.smallCta} onClick={() => setShowWizard(true)}>Create invitation <ArrowRight size={15} /></button></div>
      <button className={styles.menuButton} onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle menu">{mobileMenu ? <X /> : <Menu />}</button>
    </header>

    <section className={styles.hero} id="top">
      <div className={styles.heroCopy}><div className={styles.kicker}><Sparkles size={14} /> DIGITAL INVITATIONS, ELEVATED</div><h1>Your special day deserves <em>more</em> than a message.</h1><p>Create a beautiful digital invitation in minutes. Share one simple link with everyone who matters.</p><div className={styles.heroButtons}><button className={styles.primaryCta} onClick={() => setShowWizard(true)}>Create your invitation <ArrowRight size={17} /></button><a className={styles.watchLink} href="#templates"><span><Play size={13} fill="currentColor" /></span> See the experience</a></div><div className={styles.trust}><div className={styles.avatarStack}><i /><i /><i /><i /></div><span><strong>Made for meaningful moments</strong><small>Make your moment memorable</small></span></div></div>
      <div className={styles.heroVisual}><div className={styles.visualNote}><span>✦</span><p>Designed for<br /><strong>your story</strong></p></div><InvitationMock form={initialForm} /><div className={styles.visualBadge}><Heart size={15} fill="currentColor" /> Made with feeling</div></div>
    </section>

    <section className={styles.eyebrowStrip}><span>WEDDINGS</span><i>✦</i><span>ENGAGEMENTS</span><i>✦</i><span>BIRTHDAYS</span><i>✦</i><span>EVERYTHING WORTH CELEBRATING</span></section>

    <section className={styles.section} id="how-it-works"><div className={styles.sectionHeading}><div><div className={styles.kicker}>FROM IDEA TO INVITED</div><h2>Make an entrance<br /><em>before they arrive.</em></h2></div><p>All the warmth of a beautifully printed invitation, with the ease of a link you can send anywhere.</p></div><div className={styles.steps}><div className={styles.step}><span>01</span><div className={styles.stepIcon}>✧</div><h3>Choose your moment</h3><p>Wedding, engagement, birthday or something wonderfully yours.</p></div><div className={styles.step}><span>02</span><div className={styles.stepIcon}>✎</div><h3>Make it personal</h3><p>Add your names, details, photos and the feeling you want to share.</p></div><div className={styles.step}><span>03</span><div className={styles.stepIcon}>↗</div><h3>Send the feeling</h3><p>Get one beautiful link. Share it with everyone, everywhere.</p></div></div></section>

    <section className={`${styles.section} ${styles.templateSection}`} id="templates"><div className={styles.sectionHeading}><div><div className={styles.kicker}>THE INVITE7 EDIT</div><h2>Made for milestones<br /><em>that matter.</em></h2></div><a className={styles.textLink} href="#pricing">Explore all designs <ArrowRight size={15} /></a></div><div className={styles.templateGrid}><div className={styles.templateCard}><div className={`${styles.templateImage} ${styles.weddingImage}`}><span>THE WEDDING OF</span><strong>Arjun &amp; Priya</strong><small>12 · 12 · 2026</small></div><div><p>Elegant Gold</p><span>Wedding · Premium</span></div></div><div className={styles.templateCard}><div className={`${styles.templateImage} ${styles.engagementImage}`}><span>A BEAUTIFUL PROMISE</span><strong>Riya &amp; Adi</strong><small>Save the date</small></div><div><p>Modern Romance</p><span>Engagement · Premium</span></div></div><div className={styles.templateCard}><div className={`${styles.templateImage} ${styles.birthdayImage}`}><span>LET&apos;S CELEBRATE</span><strong>Meera turns 30</strong><small>Saturday evening</small></div><div><p>Midnight Luxe</p><span>Birthday · Premium</span></div></div></div></section>

    <section className={styles.guestSection} id="guest-list"><div className={styles.guestIntro}><h2>Smart Guest List Creation</h2><p>Ditch the chaos of Excel and paper lists. Keep all guest contacts organized with real time updates.</p></div><div className={styles.guestLayout}><div className={styles.guestVisual}><div className={styles.guestBoard}><div className={styles.guestBoardTop}><span><Users size={14} /> Guest list</span><strong>3,562 Guests</strong></div><div className={styles.guestBoardGrid}><div className={styles.guestStat}><small>Mehndi</small><b>260</b></div><div className={styles.guestStat}><small>Reception</small><b>865</b></div><div className={styles.guestStat}><small>Haldi</small><b>307</b></div><div className={`${styles.guestStat} ${styles.guestStatWarm}`}><small>Baraat</small><b>346</b></div></div></div><div className={`${styles.guestFloat} ${styles.guestFloatGroup}`}><span>Smart Grouping using AI</span><small>Close Friends</small><small>Family</small><small>Office Friends</small><small>Neighbors</small></div><div className={`${styles.guestFloat} ${styles.guestFloatImport}`}><span>Import Contacts</span><small>Android / iOS / CSV</small><div className={styles.guestProgress}><i /></div></div><div className={`${styles.guestFloat} ${styles.guestFloatEvent}`}><span>Easy contact event mapping</span><small>Guests matched to each event</small><div className={styles.guestPeople}>● ● ● ●</div></div></div><div className={styles.guestFeatures}><div><Users size={28} /><div><h3>Collaborative Contact Import</h3><p>Both families can import and manage their contacts together without the hassle of removing duplicates or incomplete information.</p></div></div><div><Sparkles size={28} /><div><h3>AI Grouping</h3><p>Invite7 automatically organizes guests into relevant groups like &quot;Delhi Friends&quot; or &quot;Work Colleagues&quot;.</p></div></div><div><CalendarDays size={28} /><div><h3>Event-Wise Distribution</h3><p>Easily assign guest groups to different wedding events and send targeted reminders to guests.</p></div></div></div></div></section>

    <section className={styles.manageSection}><div className={styles.manageIntro}><h2>Instant Guest Management</h2><p>No more endless phone calls and manual reminders. Save countless hours and let Invite7 do the manual work for you.</p></div><div className={styles.manageLayout}><div className={styles.phoneVisual}><div className={styles.phone}><div className={styles.phoneNotch} /><div className={styles.phoneHeader}>✦ invite7 <small>online</small></div><div className={styles.phoneMessage}>You are invited!! <i /></div><div className={styles.phoneLines}><span /><span /><span /><span /></div><div className={styles.phoneRsvp}><small>RSVP</small><button>Yes</button><button>Maybe</button><button>No</button></div></div><div className={styles.insightCard}><strong>Quick Insights!</strong><div><span>Accepted<br /><b>12</b></span><span>Tentative<br /><b>08</b></span><span>Pending<br /><b>12</b></span><span>Not attending<br /><b>03</b></span></div></div><div className={styles.manageFloat}><ClipboardList size={14} /> Collect +1 Details<br /><ClipboardList size={14} /> Send Reminders<br /><ClipboardList size={14} /> RSVP Data</div></div><div className={styles.manageFeatures}><div><MessageCircle size={28} /><div><h3>WhatsApp Integrated</h3><p>Automated WhatsApp RSVP reminders that guests can&apos;t miss.</p></div></div><div><Sparkles size={28} /><div><h3>One Click Data Collection</h3><p>Secure collection of guest details — from addresses to hotel check-in requirements.</p></div></div><div><Bell size={28} /><div><h3>Invite7 Admin Reminders</h3><p>Real-time RSVP tracking and reminders for offline collections.</p></div></div><div><ClipboardList size={28} /><div><h3>Automated Guest Portal</h3><p>Self-service portal for guests to update their information anytime.</p></div></div></div></div></section>

    <section className={styles.quoteSection}><div className={styles.quoteMark}>“</div><blockquote>The best invitations don&apos;t just share the details.<br /><em>They set the feeling.</em></blockquote><div className={styles.quoteByline}><span>✦</span> EVERY LITTLE DETAIL, CONSIDERED</div></section>

    <section className={`${styles.section} ${styles.pricingSection}`} id="pricing"><div className={styles.centerHeading}><div className={styles.kicker}>SIMPLE, THOUGHTFUL PRICING</div><h2>Good things, made <em>easy.</em></h2><p>Start free, upgrade when your moment calls for a little more.</p></div><div className={styles.pricingGrid}><div className={styles.priceCard}><span className={styles.priceLabel}>STARTER</span><h3>Free</h3><p>For trying something lovely</p><strong>₹0 <small>forever</small></strong><ul><li><Check size={14} /> 1 invitation</li><li><Check size={14} /> Basic templates</li><li><Check size={14} /> 3-day validity</li></ul><button onClick={() => setShowWizard(true)}>Start creating <ArrowRight size={15} /></button></div><div className={`${styles.priceCard} ${styles.featuredPrice}`}><div className={styles.popular}>MOST LOVED</div><span className={styles.priceLabel}>SIGNATURE</span><h3>Beautifully yours</h3><p>For moments worth keeping</p><strong>₹199 <small>one time</small></strong><ul><li><Check size={14} /> Premium templates</li><li><Check size={14} /> 7-day validity</li><li><Check size={14} /> No watermark</li></ul><button onClick={() => setShowWizard(true)}>Create signature invite <ArrowRight size={15} /></button></div><div className={styles.priceCard}><span className={styles.priceLabel}>KEEPSAKE</span><h3>Every detail</h3><p>For celebrations in full bloom</p><strong>₹399 <small>one time</small></strong><ul><li><Check size={14} /> 30-day validity</li><li><Check size={14} /> RSVP &amp; countdown</li><li><Check size={14} /> Advanced customization</li></ul><button onClick={() => setShowWizard(true)}>Choose keepsake <ArrowRight size={15} /></button></div></div></section>

    <section className={styles.faqSection} id="faq"><div><div className={styles.kicker}>A LITTLE CLARITY</div><h2>Questions,<br /><em>answered.</em></h2></div><div className={styles.faqList}><details open><summary>How quickly can I create an invitation? <span>+</span></summary><p>In just a few minutes. Pick a style, add your details, preview it live, and share your one-of-a-kind link.</p></details><details><summary>Can guests RSVP from the invitation? <span>+</span></summary><p>Yes. RSVP is built into our keepsake plan so you can collect names, guest counts and messages in one place.</p></details><details><summary>Can I edit after sharing? <span>+</span></summary><p>Absolutely. Your invitation stays yours. Make changes any time and the link updates instantly.</p></details></div></section>

    <footer className={styles.footer}><div className={styles.brand}><span>7</span> invite<span className={styles.brandDot}>.</span></div><p>For all the moments worth gathering for.</p><div className={styles.footerSocial}><Sparkles size={17} /><MessageCircle size={17} /><Heart size={17} /></div><small>© 2026 Invite7 · Made in India, with feeling.</small></footer>

    {showWizard && <div className={styles.overlay}><div className={styles.wizard}><button className={styles.closeWizard} onClick={() => setShowWizard(false)}><X /></button>{published ? <div className={styles.publishSuccess}><div className={styles.successIcon}><Check /></div><div className={styles.kicker}>YOUR INVITATION IS READY</div><h2>Send the <em>feeling.</em></h2><p>Your beautiful invitation is live. Share the link with everyone who matters.</p><div className={styles.shareBox}><Link2 size={16} /><span>{shareUrl}</span><button onClick={copyLink}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button></div><div className={styles.shareButtons}><a href={`https://wa.me/?text=${encodeURIComponent(`You’re invited! 💍 ${title}. View the invitation: ${shareUrl}`)}`} target="_blank"><MessageCircle size={16} /> WhatsApp</a><button onClick={copyLink}><Copy size={16} /> Copy link</button><Link href={`/invite/${slug}`} target="_blank"><ExternalLink size={16} /> View invite</Link></div><button className={styles.secondaryCta} onClick={() => setShowWizard(false)}>Back to Invite7</button></div> : <><div className={styles.wizardHeader}><div><div className={styles.kicker}>CREATE YOUR INVITATION</div><h2>Let&apos;s make it <em>yours.</em></h2></div><div className={styles.progressSteps}>{[1, 2, 3, 4].map((number) => <span key={number} className={step >= number ? styles.currentStep : ""}>{number}</span>)}</div></div><div className={styles.wizardBody}><div className={styles.formColumn}>{step === 1 && <><h3>What are we celebrating?</h3><p className={styles.formHint}>Choose the feeling that fits your moment.</p><div className={styles.eventGrid}>{eventTypes.map((event) => <button key={event.name} className={`${styles.eventChoice} ${form.eventType === event.name ? styles.selectedChoice : ""}`} onClick={() => update("eventType", event.name)}><span>{event.icon}</span><strong>{event.name}</strong><small>{event.copy}</small>{form.eventType === event.name && <Check size={15} />}</button>)}</div></>}{step === 2 && <><h3>Tell us about your moment</h3><p className={styles.formHint}>These details bring your invitation to life.</p><div className={styles.formGrid}><label>{form.eventType === "Birthday" ? "Celebrant name" : "First name"}<input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} /></label><label>{form.eventType === "Birthday" ? "Age" : "Second name"}<input value={form.eventType === "Birthday" ? form.age : form.secondName} onChange={(e) => update(form.eventType === "Birthday" ? "age" : "secondName", e.target.value)} /></label><label>Date<input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></label><label>Time<input type="time" value={form.time} onChange={(e) => update("time", e.target.value)} /></label><label className={styles.fullField}>Venue name<input value={form.venue} onChange={(e) => update("venue", e.target.value)} /></label><label className={styles.fullField}>Address<input value={form.address} onChange={(e) => update("address", e.target.value)} /></label><label className={styles.fullField}>Google Maps link <span>(optional)</span><input value={form.maps} onChange={(e) => update("maps", e.target.value)} /></label><label className={styles.fullField}>Cover photo <span>(optional)</span><input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} /></label><label className={styles.fullField}>A note for your guests<textarea value={form.message} onChange={(e) => update("message", e.target.value)} /></label></div></>}{step === 3 && <><h3>Choose your invitation style</h3><p className={styles.formHint}>A little visual soul for your big moment.</p><div className={styles.designList}>{templates.map((name, index) => <button key={name} className={`${styles.designChoice} ${template === name ? styles.selectedChoice : ""}`} onClick={() => selectTemplate(name)}><span className={`${styles.designSwatch} ${styles[`swatch${index}`]}`} /><div><strong>{name}</strong><small>{index === 0 ? "Warm, timeless & golden" : index === 1 ? "Rich, regal & unforgettable" : "Quietly beautiful"}</small></div>{template === name && <Check size={16} />}</button>)}</div></>}{step === 4 && <><h3>One last look</h3><p className={styles.formHint}>This is exactly what your guests will see.</p><div className={styles.finalPreview}><InvitationMock form={form} onPhotoUpload={uploadPhoto} /></div></>}</div><div className={styles.previewColumn}><div className={styles.previewLabel}><span>LIVE PREVIEW</span><span><Sparkles size={12} /> Updates as you type</span></div><InvitationMock form={form} compact={step !== 4} onPhotoUpload={uploadPhoto} /></div></div><div className={styles.wizardFooter}>{step > 1 ? <button className={styles.backButton} onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button> : <span />}{step < 4 ? <button className={styles.nextButton} onClick={() => setStep(step + 1)}>Continue <ChevronRight size={16} /></button> : <button className={styles.publishButton} onClick={publish}>Publish invitation <ArrowRight size={16} /></button>}</div></>}</div></div>}
  </main>;
}
