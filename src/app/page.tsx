"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  LockKeyhole,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ClipboardList,
  ExternalLink,
  Gift,
  Pause,
  Volume2,
  Heart,
  Link2,
  Menu,
  MessageCircle,
  Play,
  Sparkles,
  Share2,
  Users,
  X,
} from "lucide-react";
import styles from "./page.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import BrandLogo from "@/components/BrandLogo";
import LuxuryTemplateShowcase from "@/components/LuxuryTemplateShowcase";
import HeartLoader from "@/components/HeartLoader";

// Dynamic import of ThreeCelebrationScene to prevent heavy Three.js from blocking initial load
const ThreeCelebrationScene = dynamic(() => import("@/components/ThreeCelebrationScene"), {
  ssr: false,
  loading: () => <div className={styles.scenePlaceholder} aria-hidden="true" />,
});

type EventType = "Wedding" | "Engagement" | "Birthday" | "Reception" | "Baby Shower" | "Other";
type FormData = {
  eventType: EventType;
  firstName: string;
  secondName: string;
  date: string;
  time: string;
  venue: string;
  address: string;
  maps: string;
  message: string;
  contact: string;
  age: string;
  template: string;
  coverPhotoUrl: string;
  galleryUrls: string[];
  events: { name: string; date: string; time: string; venue: string; address: string; maps?: string }[];
  dressCode: string;
  travelInfo: string;
  musicUrl: string;
  shagunUpi: string;
  registryUrl: string;
  layoutType?: string;
};

export const ARCHITECTURE_LAYOUTS = [
  { id: "classic", title: "Classic Stationery", icon: "💌", desc: "Refined foil-stamped card with envelope & seal" },
  { id: "cinematic", title: "Cinematic Microsite", icon: "🎬", desc: "Full storybook website, hero photo & bridal squad" },
  { id: "cartoon", title: "Cartoon & Caricature", icon: "🎨", desc: "Floral rickshaw, animated avatars & Jaimala garland mini-game" },
  { id: "royalScroll", title: "Rajwadi Farman", icon: "📜", desc: "Ancient royal proclamation with carved gold rollers & shlokas" },
  { id: "magazine", title: "Haute Magazine", icon: "✨", desc: "Vogue / Vanity Fair high-fashion editorial spread" },
];

export const CURATED_MUSIC = [
  { id: "shehnai", title: "Royal Shehnai & Sitar", tag: "Indian Traditional", url: "/audio/shehnai-celebration.wav" },
  { id: "strings", title: "Romantic Strings & Cello", tag: "Warm & Emotional", url: "/audio/romantic-strings.wav" },
  { id: "piano", title: "Serene Piano & Harp", tag: "Quiet Luxury", url: "/audio/serene-piano.wav" },
  { id: "none", title: "No Background Music", tag: "Muted", url: "" },
];

const eventTypes: { name: EventType; icon: string; copy: string }[] = [
  { name: "Wedding", icon: "✦", copy: "For the beginning of forever" },
  { name: "Engagement", icon: "♡", copy: "A beautiful promise" },
  { name: "Birthday", icon: "✺", copy: "Make their day unforgettable" },
  { name: "Reception", icon: "❋", copy: "Celebrate together" },
  { name: "Baby Shower", icon: "☼", copy: "A little love is on the way" },
  { name: "Other", icon: "✧", copy: "Your moment, your way" },
];

const initialForm: FormData = {
  eventType: "Wedding",
  firstName: "",
  secondName: "",
  date: "",
  time: "",
  venue: "",
  address: "",
  maps: "",
  message: "",
  contact: "",
  age: "",
  template: "Elegant Gold",
  coverPhotoUrl: "",
  galleryUrls: [],
  events: [],
  dressCode: "",
  travelInfo: "",
  musicUrl: "/audio/shehnai-celebration.wav",
  shagunUpi: "",
  registryUrl: "",
  layoutType: "classic",
};

const landingPreviewSample: FormData = {
  eventType: "Wedding",
  firstName: "Aarav",
  secondName: "Meera",
  date: "2026-11-28",
  time: "19:00",
  venue: "The Royal Palace, Udaipur",
  address: "Palace Road, Udaipur",
  maps: "https://maps.google.com",
  message: "Together with our families, we joyfully invite you to celebrate our union.",
  contact: "",
  age: "",
  template: "Elegant Gold",
  coverPhotoUrl: "",
  galleryUrls: [],
  events: [],
  dressCode: "",
  travelInfo: "",
  musicUrl: "/audio/shehnai-celebration.wav",
  shagunUpi: "",
  registryUrl: "",
  layoutType: "classic",
};

function prettyDate(value: string) {
  if (!value) return "Select Celebration Date";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Select Celebration Date";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(parsed);
}

function timeLabel(value: string) {
  if (!value) return "Select Time";
  const parsed = new Date(`2026-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return "Select Time";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(parsed);
}

function invitationSlug(firstName: string, secondName: string) {
  const clean = (value: string) => value.trim().replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return `${clean(firstName)}${clean(secondName)}` || "INVITATION";
}

const templateDescriptions: Record<string, string> = {
  "Elegant Gold": "Warm, timeless & golden",
  "Royal Indian": "Rich, regal & unforgettable",
  "Modern Ivory": "Quiet, minimal & refined",
  "Garden Floral": "Fresh, botanical & romantic",
  "Tamil Heritage": "Kolam, ivory & temple gold",
  "Temple Kalyanam": "Deep maroon & festive gold",
  "Fun & Bright": "Joyful, energetic & vivid",
  "Midnight Luxe": "Dark, sleek & mysterious",
  "Minimal Joy": "Soft, modern & understated",
};

function InvitationMock({
  form,
  compact = false,
}: {
  form: FormData;
  compact?: boolean;
}) {
  const normalizedTheme = (form.template || "Elegant Gold").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const ornament =
    ({
      royalindian: "❖",
      modernivory: "·",
      gardenfloral: "❀",
      funbright: "★",
      midnightluxe: "✧",
      minimaljoy: "✦",
    } as Record<string, string>)[normalizedTheme] || "✦";

  const hasFirstName = Boolean(form.firstName.trim());
  const hasSecondName = Boolean(form.secondName.trim());
  const hasNames = hasFirstName || hasSecondName;

  return (
    <div className={`${styles.invitationMock} ${compact ? styles.compact : ""}`} data-theme={normalizedTheme}>
      <div className={styles.mockGlow} />
      <div className={styles.mockTopline}>TRAXVA · YOUR MOMENT, BEAUTIFULLY TOLD</div>
      <div className={styles.mockOrnament} aria-hidden="true">{ornament}</div>
      <p className={styles.mockEyebrow}>You&apos;re invited</p>
      <p className={styles.mockTogether}>Together with their families</p>
      <h3 style={{ opacity: hasNames ? 1 : 0.65 }}>
        {form.eventType === "Birthday" ? (
          form.firstName.trim() || "Celebrant's Name"
        ) : (
          <>
            {form.firstName.trim() || "First Name"} <i>&amp;</i> {form.secondName.trim() || "Partner Name"}
          </>
        )}
      </h3>
      <p className={styles.mockCopy}>
        {form.eventType === "Wedding"
          ? "joyfully invite you to celebrate their wedding"
          : `invite you to celebrate their ${form.eventType.toLowerCase()}`}
      </p>
      <div className={styles.mockDivider} aria-hidden="true">
        <span>{ornament}</span>
      </div>
      <strong style={{ opacity: form.date ? 1 : 0.65 }}>{prettyDate(form.date)}</strong>
      <span style={{ opacity: form.venue || form.time ? 1 : 0.65 }}>
        {timeLabel(form.time)} · {form.venue.trim() || "Venue / Destination"}
      </span>
      {!compact && (
        <div className={styles.mockActions} style={{ pointerEvents: "none" }}>
          <button type="button">Get directions</button>
          <button type="button">RSVP</button>
        </div>
      )}
    </div>
  );
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
  const [showWizard, setShowWizard] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialForm);
  const [template, setTemplate] = useState("Elegant Gold");
  const plan = "starter";
  const [published, setPublished] = useState(false);
  const [publishedSlug, setPublishedSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  function togglePreviewAudio(url: string) {
    if (!url) {
      if (previewAudioRef.current) previewAudioRef.current.pause();
      setPreviewPlaying(null);
      return;
    }
    if (previewAudioRef.current && previewPlaying === url) {
      previewAudioRef.current.pause();
      setPreviewPlaying(null);
      return;
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }
    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.play().then(() => setPreviewPlaying(url)).catch(() => {});
    audio.onended = () => setPreviewPlaying(null);
  }

  useEffect(() => {
    const pending = getInitialPendingData();
    if (pending) {
      queueMicrotask(() => {
        if (pending.form) setForm(pending.form);
        if (pending.template) setTemplate(pending.template);
        setShowWizard(true);
        setStep(4);
      });
    } else if (typeof window !== "undefined" && (window.location.hash === "#wizard" || window.location.search.includes("create=true"))) {
      queueMicrotask(() => setShowWizard(true));
    }
    createSupabaseBrowserClient()
      .auth.getUser()
      .then(({ data }) => {
        setIsLoggedIn(Boolean(data.user));
      })
      .catch(() => setIsLoggedIn(false));

    // Scroll listener for sticky adaptive navbar
    const handleScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Keyboard navigation (Escape to close wizard)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowWizard(false);
        setMobileMenu(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Scroll reveal observer for fluid animations
    const revealCallback: IntersectionObserverCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.revealed);
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(revealCallback, {
      threshold: 0.08,
      rootMargin: "0px 0px -30px 0px",
    });

    const elements = document.querySelectorAll(`.${styles.scrollReveal}`);
    elements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
      observer.disconnect();
    };
  }, []);

  function selectTemplate(newTemplate: string) {
    setTemplate(newTemplate);
    setForm((current) => ({ ...current, template: newTemplate }));
  }

  const update = (key: keyof FormData, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function uploadPhoto(file: File) {
    setIsUploadingPhoto(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) {
        setPublishError(result.error || "Could not upload the photo.");
        return;
      }
      setForm((current) => ({
        ...current,
        coverPhotoUrl: result.url,
        galleryUrls: [...current.galleryUrls, result.url],
      }));
    } catch {
      setPublishError("Could not upload the photo.");
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  const templates =
    form.eventType === "Birthday"
      ? ["Fun & Bright", "Midnight Luxe", "Minimal Joy"]
      : [
          "Elegant Gold",
          "Royal Indian",
          "Modern Ivory",
          "Garden Floral",
          "Tamil Heritage",
          "Temple Kalyanam",
        ];

  const generatedSlug = useMemo(
    () => invitationSlug(form.firstName, form.secondName),
    [form.firstName, form.secondName]
  );
  const slug = publishedSlug || generatedSlug;
  const activeSlug = slug;
  const shareUrl =
    typeof window === "undefined"
      ? `https://traxva.in/invite/${activeSlug}`
      : `${window.location.origin}/invite/${activeSlug}`;

  const title = useMemo(
    () =>
      form.eventType === "Birthday"
        ? `${form.firstName}'s birthday`
        : `${form.firstName} & ${form.secondName}'s ${form.eventType.toLowerCase()}`,
    [form]
  );

  async function publish() {
    if (
      !form.firstName.trim() ||
      !form.date ||
      !form.time ||
      !form.venue.trim() ||
      (form.eventType !== "Birthday" && !form.secondName.trim())
    ) {
      setPublishError("Please complete the required name, date, time and venue fields before publishing.");
      return;
    }
    setIsPublishing(true);
    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          secondName: form.eventType === "Birthday" ? "" : form.secondName,
          template,
          layoutType: form.layoutType || "classic",
          plan,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          try {
            localStorage.setItem("invite7-pending-invitation", JSON.stringify({ form, template }));
          } catch {}
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
      try {
        localStorage.setItem("invite7-active-invitation-slug", result.slug);
        localStorage.removeItem("invite7-pending-invitation");
      } catch {}
    } catch {
      setPublishError("An unexpected error occurred while publishing.");
    } finally {
      setIsPublishing(false);
    }
  }

  function copyLink() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main className={styles.siteShell}>
      {publishError && (
        <p role="alert" className={styles.inlineError}>
          {publishError}
        </p>
      )}

      {/* Sticky Adaptive Navbar */}
      <header className={`${styles.navbar} ${scrolled ? styles.navbarScrolled : ""}`}>
        <BrandLogo href="#top" variant="nav" />

        {/* Mobile Scrim */}
        <div
          className={`${styles.navScrim} ${mobileMenu ? styles.scrimVisible : ""}`}
          onClick={() => setMobileMenu(false)}
          aria-hidden="true"
        />

        <nav className={`${styles.navLinks} ${mobileMenu ? styles.navOpen : ""}`} aria-label="Main Navigation">
          <a href="#how-it-works" onClick={() => setMobileMenu(false)}>
            How it works
          </a>
          <a href="#templates" onClick={() => setMobileMenu(false)}>
            Templates
          </a>
          <a href="#pricing" onClick={() => setMobileMenu(false)}>
            Pricing
          </a>
          <a href="#faq" onClick={() => setMobileMenu(false)}>
            FAQ
          </a>
          <a href="#contact" onClick={() => setMobileMenu(false)}>
            Contact
          </a>

          <div className={styles.mobileNavActions}>
            <button
              type="button"
              className={styles.mobileLoginBtn}
              onClick={() => {
                setMobileMenu(false);
                router.push(isLoggedIn ? "/dashboard" : "/login?next=/");
              }}
            >
              {isLoggedIn ? "Host Dashboard" : "Log in"}
            </button>
            <button
              type="button"
              className={styles.mobileCtaBtn}
              onClick={() => {
                setMobileMenu(false);
                setShowWizard(true);
              }}
            >
              Create invitation <ArrowRight size={15} />
            </button>
          </div>
        </nav>

        <div className={styles.navActions}>
          <button
            type="button"
            className={styles.login}
            onClick={() => router.push(isLoggedIn ? "/dashboard" : "/login?next=/")}
          >
            {isLoggedIn ? "Dashboard" : "Log in"}
          </button>
          <button type="button" className={styles.smallCta} onClick={() => setShowWizard(true)}>
            Create invitation <ArrowRight size={15} />
          </button>
        </div>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label={mobileMenu ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenu}
        >
          {mobileMenu ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {/* Hero Section */}
      <section className={styles.hero} id="top">
        <ThreeCelebrationScene variant="hero" speed={1.1} />
        <div className={styles.heroCopy}>
          <div className={styles.kicker}>
            <Sparkles size={14} className={styles.kickerSparkle} aria-hidden="true" /> DIGITAL INVITATIONS, ELEVATED
          </div>
          <h1>Your special day deserves <em>more</em> than a message.</h1>
          <p>
            Create an exquisite digital invitation in minutes. Share one beautiful link with everyone who matters.
          </p>
          <div className={styles.heroButtons}>
            <button type="button" className={styles.primaryCta} onClick={() => setShowWizard(true)}>
              Create your invitation <ArrowRight size={17} />
            </button>
            <a className={styles.watchLink} href="#templates">
              <span aria-hidden="true">
                <Play size={13} fill="currentColor" />
              </span>{" "}
              See the experience
            </a>
          </div>
          <div className={styles.trust}>
            <div className={styles.avatarStack} aria-hidden="true">
              <span className={styles.avatarPill} style={{ background: "#783b2e" }}>AP</span>
              <span className={styles.avatarPill} style={{ background: "#35483d" }}>RK</span>
              <span className={styles.avatarPill} style={{ background: "#b4945b" }}>MK</span>
              <span className={styles.avatarPill} style={{ background: "#263238" }}>SR</span>
            </div>
            <div className={styles.trustInfo}>
              <div className={styles.ratingStars} aria-label="5 out of 5 stars">
                ★★★★★ <strong>4.9 / 5</strong>
              </div>
              <small>Over 10,000+ celebrations created with feeling</small>
            </div>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.visualNote}>
            <span aria-hidden="true">✦</span>
            <p>
              Designed for<br />
              <strong>your story</strong>
            </p>
          </div>
          <InvitationMock form={landingPreviewSample} />
          <div className={styles.visualBadge}>
            <Heart size={15} fill="currentColor" aria-hidden="true" /> Made with feeling
          </div>
        </div>
      </section>

      {/* Continuous Infinite Editorial Marquee */}
      <section className={styles.eyebrowStrip} aria-label="Celebration themes">
        <div className={styles.marqueeTrack}>
          <span>WEDDINGS</span>
          <i aria-hidden="true">✦</i>
          <span>ENGAGEMENTS</span>
          <i aria-hidden="true">✦</i>
          <span>BIRTHDAYS</span>
          <i aria-hidden="true">✦</i>
          <span>RECEPTIONS</span>
          <i aria-hidden="true">✦</i>
          <span>BABY SHOWERS</span>
          <i aria-hidden="true">✦</i>
          <span>REAL-TIME RSVP</span>
          <i aria-hidden="true">✦</i>
          <span>WHATSAPP SHARING</span>
          <i aria-hidden="true">✦</i>
          <span>INTERACTIVE MAPS</span>
          <i aria-hidden="true">✦</i>
          <span>EVERYTHING WORTH CELEBRATING</span>
          <i aria-hidden="true">✦</i>
          <span>WEDDINGS</span>
          <i aria-hidden="true">✦</i>
          <span>ENGAGEMENTS</span>
          <i aria-hidden="true">✦</i>
          <span>BIRTHDAYS</span>
          <i aria-hidden="true">✦</i>
          <span>RECEPTIONS</span>
          <i aria-hidden="true">✦</i>
          <span>BABY SHOWERS</span>
          <i aria-hidden="true">✦</i>
          <span>REAL-TIME RSVP</span>
          <i aria-hidden="true">✦</i>
          <span>WHATSAPP SHARING</span>
          <i aria-hidden="true">✦</i>
          <span>INTERACTIVE MAPS</span>
          <i aria-hidden="true">✦</i>
          <span>EVERYTHING WORTH CELEBRATING</span>
          <i aria-hidden="true">✦</i>
        </div>
      </section>

      {/* How it works */}
      <section className={styles.section} id="how-it-works">
        <div className={`${styles.sectionHeading} ${styles.scrollReveal}`}>
          <div>
            <div className={styles.kicker}>FROM IDEA TO INVITED</div>
            <h2>
              Make an entrance<br />
              <em>before they arrive.</em>
            </h2>
          </div>
          <p>All the warmth of a beautifully printed invitation, with the ease of a link you can send anywhere.</p>
        </div>
        <div className={styles.steps}>
          <div className={`${styles.step} ${styles.scrollReveal} ${styles.delay1}`}>
            <span>01</span>
            <div className={styles.stepIcon} aria-hidden="true">✧</div>
            <h3>Choose your moment</h3>
            <p>Wedding, engagement, birthday or something wonderfully yours.</p>
          </div>
          <div className={`${styles.step} ${styles.scrollReveal} ${styles.delay2}`}>
            <span>02</span>
            <div className={styles.stepIcon} aria-hidden="true">✎</div>
            <h3>Make it personal</h3>
            <p>Add your names, details, photos and the feeling you want to share.</p>
          </div>
          <div className={`${styles.step} ${styles.scrollReveal} ${styles.delay3}`}>
            <span>03</span>
            <div className={styles.stepIcon} aria-hidden="true">↗</div>
            <h3>Send the feeling</h3>
            <p>Get one beautiful link. Share it with everyone, everywhere.</p>
          </div>
        </div>
      </section>

      {/* Stationery Showcase */}
      <LuxuryTemplateShowcase
        onSelectTemplate={(name) => {
          update("template", name);
          setShowWizard(true);
        }}
        onOpenWizard={() => setShowWizard(true)}
      />

      {/* Smart Guest List Creation */}
      <section className={styles.guestSection} id="guest-list">
        <div className={`${styles.guestIntro} ${styles.scrollReveal}`}>
          <h2>Smart Guest List Creation</h2>
          <p>Ditch the chaos of Excel and paper lists. Keep all guest contacts organized with real time updates.</p>
        </div>
        <div className={styles.guestLayout}>
          <div className={`${styles.guestVisual} ${styles.scrollReveal} ${styles.delay1}`}>
            <div className={styles.guestBoard}>
              <div className={styles.guestBoardTop}>
                <span>
                  <Users size={14} /> Guest list
                </span>
                <strong>3,562 Guests</strong>
              </div>
              <div className={styles.guestBoardGrid}>
                <div className={styles.guestStat}>
                  <small>Mehndi</small>
                  <b>260</b>
                </div>
                <div className={styles.guestStat}>
                  <small>Reception</small>
                  <b>865</b>
                </div>
                <div className={styles.guestStat}>
                  <small>Haldi</small>
                  <b>307</b>
                </div>
                <div className={`${styles.guestStat} ${styles.guestStatWarm}`}>
                  <small>Baraat</small>
                  <b>346</b>
                </div>
              </div>
            </div>
            <div className={`${styles.guestFloat} ${styles.guestFloatGroup}`}>
              <span>Smart Grouping</span>
              <small>Close Friends</small>
              <small>Family</small>
              <small>Office Friends</small>
              <small>Neighbors</small>
            </div>
            <div className={`${styles.guestFloat} ${styles.guestFloatImport}`}>
              <span>Import Contacts</span>
              <small>Android / iOS / CSV</small>
              <div className={styles.guestProgress}>
                <i />
              </div>
            </div>
            <div className={`${styles.guestFloat} ${styles.guestFloatEvent}`}>
              <span>Easy contact event mapping</span>
              <small>Guests matched to each event</small>
              <div className={styles.guestPeople}>● ● ● ●</div>
            </div>
          </div>
          <div className={`${styles.guestFeatures} ${styles.scrollReveal} ${styles.delay2}`}>
            <div>
              <Users size={28} />
              <div>
                <h3>Collaborative Contact Import</h3>
                <p>
                  Both families can import and manage their contacts together without the hassle of removing duplicates
                  or incomplete information.
                </p>
              </div>
            </div>
            <div>
              <Sparkles size={28} />
              <div>
                <h3>Smart Grouping</h3>
                <p>TRAXVA automatically organizes guests into relevant groups like &quot;Delhi Friends&quot; or &quot;Work Colleagues&quot;.</p>
              </div>
            </div>
            <div>
              <CalendarDays size={28} />
              <div>
                <h3>Event-Wise Distribution</h3>
                <p>Easily assign guest groups to different wedding events and send targeted reminders to guests.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Guest Management */}
      <section className={styles.manageSection}>
        <div className={`${styles.manageIntro} ${styles.scrollReveal}`}>
          <h2>Instant Guest Management</h2>
          <p>No more endless phone calls and manual reminders. Save countless hours and let TRAXVA do the manual work for you.</p>
        </div>
        <div className={styles.manageLayout}>
          <div className={`${styles.phoneVisual} ${styles.scrollReveal} ${styles.delay1}`}>
            <div className={styles.phone}>
              <div className={styles.phoneNotch} />
              <div className={styles.phoneHeader}>
                ✦ traxva <small>online</small>
              </div>
              <div className={styles.phoneMessage}>
                You are invited!! <i />
              </div>
              <div className={styles.phoneLines}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={styles.phoneRsvp}>
                <small>RSVP</small>
                <button type="button">Yes</button>
                <button type="button">Maybe</button>
                <button type="button">No</button>
              </div>
            </div>
            <div className={styles.insightCard}>
              <strong>Quick Insights!</strong>
              <div>
                <span>
                  Accepted<br />
                  <b>12</b>
                </span>
                <span>
                  Tentative<br />
                  <b>08</b>
                </span>
                <span>
                  Pending<br />
                  <b>12</b>
                </span>
                <span>
                  Not attending<br />
                  <b>03</b>
                </span>
              </div>
            </div>
            <div className={styles.manageFloat}>
              <ClipboardList size={14} /> Collect +1 Details<br />
              <ClipboardList size={14} /> Send Reminders<br />
              <ClipboardList size={14} /> RSVP Data
            </div>
          </div>
          <div className={`${styles.manageFeatures} ${styles.scrollReveal} ${styles.delay2}`}>
            <div>
              <MessageCircle size={28} />
              <div>
                <h3>WhatsApp Integrated</h3>
                <p>Automated WhatsApp RSVP reminders that guests can&apos;t miss.</p>
              </div>
            </div>
            <div>
              <Sparkles size={28} />
              <div>
                <h3>One Click Data Collection</h3>
                <p>Secure collection of guest details — from addresses to hotel check-in requirements.</p>
              </div>
            </div>
            <div>
              <Bell size={28} />
              <div>
                <h3>TRAXVA Host Reminders</h3>
                <p>Real-time RSVP tracking and reminders for offline collections.</p>
              </div>
            </div>
            <div>
              <ClipboardList size={28} />
              <div>
                <h3>Automated Guest Portal</h3>
                <p>Self-service portal for guests to update their information anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Quote */}
      <section className={`${styles.quoteSection} ${styles.scrollReveal}`}>
        <div className={styles.quoteMark} aria-hidden="true">“</div>
        <blockquote>
          The best invitations don&apos;t just share the details.<br />
          <em>They set the feeling.</em>
        </blockquote>
        <div className={styles.quoteByline}>
          <span aria-hidden="true">✦</span> EVERY LITTLE DETAIL, CONSIDERED
        </div>
      </section>

      {/* Real Couple Testimonials & Reviews */}
      <section className={`${styles.testimonialsSection} ${styles.scrollReveal}`} aria-label="Couple Testimonials">
        <div className={styles.centerHeading}>
          <div className={styles.kicker}>
            <Sparkles size={14} aria-hidden="true" /> CELEBRATED WITH TRAXVA
          </div>
          <h2>Love stories, <em>real voices.</em></h2>
          <p>Over 10,000 celebrations crafted with feeling across India and worldwide.</p>
        </div>

        <div className={styles.testimonialsGrid}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars} aria-hidden="true">★★★★★</div>
            <p>
              “Our guests couldn’t stop talking about the wax seal opening and background Shehnai. Collecting 350+ RSVPs
              directly via WhatsApp saved our families weeks of phone calls!”
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">AD</div>
              <div>
                <strong>Aarav &amp; Diya</strong>
                <span>Jaipur Palace Wedding · 350 Guests</span>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars} aria-hidden="true">★★★★★</div>
            <p>
              “The digital Shagun UPI QR code made gifting effortless for our friends flying in from the US and UK.
              Elegant, seamless, and completely commission-free.”
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">RK</div>
              <div>
                <strong>Rohan &amp; Kavya</strong>
                <span>Goa Beach Wedding · 210 Guests</span>
              </div>
            </div>
          </div>

          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars} aria-hidden="true">★★★★★</div>
            <p>
              “The Haute Couture editorial layout was stunning on mobile. Everyone thought we hired a bespoke Parisian
              design studio. Truly unforgettable.”
            </p>
            <div className={styles.testimonialAuthor}>
              <div className={styles.authorAvatar} aria-hidden="true">MK</div>
              <div>
                <strong>Meera &amp; Kabir</strong>
                <span>Mumbai Sangeet &amp; Reception · 480 Guests</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className={`${styles.section} ${styles.pricingSection}`} id="pricing">
        <div className={`${styles.centerHeading} ${styles.scrollReveal}`}>
          <div className={styles.kicker}>SIMPLE, THOUGHTFUL PRICING</div>
          <h2>Good things, made <em>easy.</em></h2>
          <p>Start free today. Premium paid plans coming soon!</p>
        </div>
        <div className={styles.pricingGrid}>
          <div className={`${styles.priceCard} ${styles.activePlanCard} ${styles.scrollReveal} ${styles.delay1}`}>
            <span className={styles.priceLabel}>STARTER</span>
            <h3>Free</h3>
            <p>For trying something lovely</p>
            <strong>
              ₹0 <small>forever</small>
            </strong>
            <ul>
              <li>
                <Check size={14} /> 1 invitation
              </li>
              <li>
                <Check size={14} /> Basic templates
              </li>
              <li>
                <Check size={14} /> 3-day validity
              </li>
            </ul>
            <button type="button" onClick={() => setShowWizard(true)}>
              Start creating <ArrowRight size={15} />
            </button>
          </div>
          <div className={`${styles.priceCard} ${styles.comingSoonCard} ${styles.scrollReveal} ${styles.delay2}`}>
            <div className={styles.comingSoonTag}>COMING SOON</div>
            <span className={styles.priceLabel}>SIGNATURE</span>
            <h3>Beautifully yours</h3>
            <p>For moments worth keeping</p>
            <strong>
              ₹199 <small>one time</small>
            </strong>
            <ul>
              <li>
                <Check size={14} /> Premium templates
              </li>
              <li>
                <Check size={14} /> 7-day validity
              </li>
              <li>
                <Check size={14} /> No watermark
              </li>
            </ul>
            <button type="button" disabled className={styles.comingSoonButton}>
              Coming soon
            </button>
          </div>
          <div className={`${styles.priceCard} ${styles.comingSoonCard} ${styles.scrollReveal} ${styles.delay3}`}>
            <div className={styles.comingSoonTag}>COMING SOON</div>
            <span className={styles.priceLabel}>KEEPSAKE</span>
            <h3>Every detail</h3>
            <p>For celebrations in full bloom</p>
            <strong>
              ₹399 <small>one time</small>
            </strong>
            <ul>
              <li>
                <Check size={14} /> 30-day validity
              </li>
              <li>
                <Check size={14} /> RSVP &amp; countdown
              </li>
              <li>
                <Check size={14} /> Advanced customization
              </li>
            </ul>
            <button type="button" disabled className={styles.comingSoonButton}>
              Coming soon
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`${styles.faqSection} ${styles.scrollReveal}`} id="faq">
        <div>
          <div className={styles.kicker}>A LITTLE CLARITY</div>
          <h2>
            Questions,<br />
            <em>answered.</em>
          </h2>
        </div>
        <div className={styles.faqList}>
          <details open>
            <summary>
              How quickly can I create an invitation? <span>+</span>
            </summary>
            <p>In just a few minutes. Pick a style, add your details, preview it live, and share your one-of-a-kind link.</p>
          </details>
          <details>
            <summary>
              Can guests RSVP from the invitation? <span>+</span>
            </summary>
            <p>Yes. RSVP is built into our platform so you can collect names, guest counts and messages in one place.</p>
          </details>
          <details>
            <summary>
              Can I edit after sharing? <span>+</span>
            </summary>
            <p>Absolutely. Your invitation stays yours. Make changes any time and the link updates instantly.</p>
          </details>
        </div>
      </section>

      {/* Comprehensive Footer */}
      <footer className={`${styles.footer} ${styles.scrollReveal}`} id="contact">
        <div className={styles.footerGrid}>
          <div className={styles.footerBrandCol}>
            <BrandLogo href="#top" variant="footer" />
            <p>For all the meaningful moments worth gathering for.</p>
            <div className={styles.footerSocial}>
              <a
                href="https://wa.me"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Connect via WhatsApp Support"
              >
                <MessageCircle size={18} />
              </a>
              <span aria-hidden="true">
                <Sparkles size={18} />
              </span>
              <span aria-hidden="true">
                <Heart size={18} />
              </span>
            </div>
          </div>

          <div className={styles.footerCol}>
            <h4>Experience</h4>
            <ul>
              <li>
                <a href="#how-it-works">How it works</a>
              </li>
              <li>
                <a href="#templates">Stationery Collection</a>
              </li>
              <li>
                <a href="#pricing">Thoughtful Pricing</a>
              </li>
              <li>
                <a href="#faq">Frequently Asked</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Host Tools</h4>
            <ul>
              <li>
                <button
                  type="button"
                  onClick={() => setShowWizard(true)}
                  className={styles.footerTextBtn}
                >
                  Create Invitation
                </button>
              </li>
              <li>
                <Link href={isLoggedIn ? "/dashboard" : "/login?next=/dashboard"}>
                  {isLoggedIn ? "Host Dashboard" : "Host Login"}
                </Link>
              </li>
              <li>
                <a href="mailto:support@traxva.in">support@traxva.in</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Legal &amp; Trust</h4>
            <ul>
              <li>
                <Link href="/privacy">Privacy Policy</Link>
              </li>
              <li>
                <Link href="/terms">Terms of Service</Link>
              </li>
              <li>
                <span>256-Bit SSL Encrypted</span>
              </li>
              <li>
                <span>Direct Bank UPI (Zero Fee)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <small>© 2026 TRAXVA · A Product by Eantrax · Made in India, with feeling.</small>
          <span>Crafted for timeless celebrations.</span>
        </div>
      </footer>

      {/* Creation Wizard Overlay */}
      {showWizard && (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="wizard-modal-title">
          <div className={styles.wizard} data-lenis-prevent="true">
            <button
              type="button"
              className={styles.closeWizard}
              onClick={() => setShowWizard(false)}
              aria-label="Close creation wizard"
            >
              <X size={20} />
            </button>
            {published ? (
              <div className={styles.publishSuccess}>
                <div className={styles.successIcon}>
                  <Check size={24} />
                </div>
                <div className={styles.kicker}>YOUR INVITATION IS READY</div>
                <h2>Send the <em>feeling.</em></h2>
                <p>Your beautiful invitation is live. Share the link directly with your guests, or manage responses from your dashboard.</p>

                {/* Direct Sharing Links */}
                <div className={styles.shareBox}>
                  <Link2 size={16} />
                  <span>{shareUrl}</span>
                  <button type="button" onClick={copyLink}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className={styles.shareButtons}>
                  {form.contact ? (
                    <a
                      href={`https://wa.me/${
                        form.contact.replace(/\D/g, "").length === 10
                          ? `91${form.contact.replace(/\D/g, "")}`
                          : form.contact.replace(/\D/g, "")
                      }?text=${encodeURIComponent(`Here is your live invitation link: ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        background: "#25D366",
                        color: "#fff",
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      <MessageCircle size={16} /> Send to my WhatsApp (
                      {form.contact.replace(/\D/g, "").length === 10
                        ? `+91 ${form.contact.replace(/\D/g, "")}`
                        : form.contact}
                      )
                    </a>
                  ) : null}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(
                      `You’re invited! 💍 ${title}. View the invitation: ${shareUrl}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Share2 size={16} /> Share with Guests
                  </a>
                  <Link href={`/invite/${slug}`} target="_blank">
                    <ExternalLink size={16} /> View live invitation
                  </Link>
                </div>

                {/* Host Dashboard Option */}
                {isLoggedIn ? (
                  <div className={styles.dashboardCard}>
                    <div className={styles.dashboardCardLeft}>
                      <BarChart3 size={20} color="#a7553f" />
                      <div>
                        <strong>Your Host Dashboard is ready</strong>
                        <p>Track RSVPs, manage guest list, and send automated WhatsApp reminders.</p>
                      </div>
                    </div>
                    <Link href={`/dashboard?slug=${slug}`} className={styles.dashboardLinkBtn}>
                      Open Host Dashboard <ArrowRight size={14} />
                    </Link>
                  </div>
                ) : (
                  <div className={styles.dashboardCard}>
                    <div className={styles.dashboardCardLeft}>
                      <LockKeyhole size={20} color="#a7553f" />
                      <div>
                        <strong>Want to track RSVPs &amp; Guest List?</strong>
                        <p>Sign in to your free host dashboard to monitor attendance and RSVPs in real time.</p>
                      </div>
                    </div>
                    <Link
                      href={`/login?next=${encodeURIComponent(`/dashboard?slug=${slug}`)}`}
                      className={styles.dashboardLinkBtn}
                    >
                      Sign in for Dashboard <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  className={styles.secondaryCta}
                  onClick={() => setShowWizard(false)}
                  style={{ marginTop: "24px" }}
                >
                  Back to TRAXVA
                </button>
              </div>
            ) : (
              <>
                <div className={styles.wizardHeader}>
                  <div>
                    <div className={styles.kicker}>CREATE YOUR INVITATION</div>
                    <h2 id="wizard-modal-title">
                      Let&apos;s make it <em>yours.</em>
                    </h2>
                  </div>
                  <div className={styles.progressSteps} aria-label={`Step ${step} of 4`}>
                    {[1, 2, 3, 4].map((number) => (
                      <span key={number} className={step >= number ? styles.currentStep : ""}>
                        {number}
                      </span>
                    ))}
                  </div>
                </div>

                <div className={styles.wizardBody}>
                  <div className={styles.formColumn}>
                    {step === 1 && (
                      <>
                        <h3>What are we celebrating?</h3>
                        <p className={styles.formHint}>Choose the feeling that fits your moment.</p>
                        <div className={styles.eventGrid}>
                          {eventTypes.map((event) => (
                            <button
                              type="button"
                              key={event.name}
                              className={`${styles.eventChoice} ${
                                form.eventType === event.name ? styles.selectedChoice : ""
                              }`}
                              onClick={() => update("eventType", event.name)}
                            >
                              <span>{event.icon}</span>
                              <strong>{event.name}</strong>
                              <small>{event.copy}</small>
                              {form.eventType === event.name && <Check size={15} />}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <h3>Tell us about your moment</h3>
                        <p className={styles.formHint}>These details bring your invitation to life.</p>
                        <div className={styles.formGrid}>
                          <label htmlFor="wizard-firstName">
                            {form.eventType === "Birthday" ? "Celebrant name" : "First name"}
                            <input
                              id="wizard-firstName"
                              name="firstName"
                              autoComplete="given-name"
                              value={form.firstName}
                              onChange={(e) => update("firstName", e.target.value)}
                              placeholder={form.eventType === "Birthday" ? "e.g. Aarav" : "e.g. Rahul"}
                            />
                          </label>

                          <label htmlFor="wizard-secondName">
                            {form.eventType === "Birthday" ? "Age" : "Second name"}
                            <input
                              id="wizard-secondName"
                              name="secondName"
                              autoComplete="family-name"
                              value={form.eventType === "Birthday" ? form.age : form.secondName}
                              onChange={(e) =>
                                update(form.eventType === "Birthday" ? "age" : "secondName", e.target.value)
                              }
                              placeholder={form.eventType === "Birthday" ? "e.g. 25th" : "e.g. Ananya"}
                            />
                          </label>

                          <label htmlFor="wizard-date">
                            Date
                            <input
                              id="wizard-date"
                              name="date"
                              type="date"
                              value={form.date}
                              onChange={(e) => update("date", e.target.value)}
                            />
                          </label>

                          <label htmlFor="wizard-time">
                            Time
                            <input
                              id="wizard-time"
                              name="time"
                              type="time"
                              value={form.time}
                              onChange={(e) => update("time", e.target.value)}
                            />
                          </label>

                          <label htmlFor="wizard-venue" className={styles.fullField}>
                            Venue name
                            <input
                              id="wizard-venue"
                              name="venue"
                              autoComplete="organization"
                              value={form.venue}
                              onChange={(e) => update("venue", e.target.value)}
                              placeholder="e.g. The Taj Palace, Mumbai"
                            />
                          </label>

                          <label htmlFor="wizard-address" className={styles.fullField}>
                            Address
                            <input
                              id="wizard-address"
                              name="address"
                              autoComplete="street-address"
                              value={form.address}
                              onChange={(e) => update("address", e.target.value)}
                              placeholder="e.g. Apollo Bunder, Colaba, Mumbai"
                            />
                          </label>

                          <label htmlFor="wizard-contact" className={styles.fullField}>
                            Host WhatsApp / Phone <span>(10-digit mobile number)</span>
                            <input
                              id="wizard-contact"
                              name="contact"
                              type="tel"
                              autoComplete="tel"
                              inputMode="numeric"
                              pattern="[0-9]{10}"
                              maxLength={10}
                              value={form.contact}
                              onChange={(e) =>
                                update("contact", e.target.value.replace(/\D/g, "").slice(0, 10))
                              }
                              placeholder="9876543210"
                            />
                          </label>

                          <label htmlFor="wizard-maps" className={styles.fullField}>
                            Google Maps link <span>(optional)</span>
                            <input
                              id="wizard-maps"
                              name="maps"
                              value={form.maps}
                              onChange={(e) => update("maps", e.target.value)}
                              placeholder="https://maps.app.goo.gl/..."
                            />
                          </label>

                          <label htmlFor="wizard-photo" className={styles.fullField}>
                            Cover photo <span>(optional)</span>
                            <input
                              id="wizard-photo"
                              name="photo"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) uploadPhoto(f);
                              }}
                            />
                          </label>

                          <label htmlFor="wizard-message" className={styles.fullField}>
                            A note for your guests
                            <textarea
                              id="wizard-message"
                              name="message"
                              value={form.message}
                              onChange={(e) => update("message", e.target.value)}
                              placeholder="We would love to celebrate this special day with you..."
                            />
                          </label>

                          <div className={styles.shagunBox}>
                            <div className={styles.shagunHeader}>
                              <Gift size={16} /> <strong>Digital Shagun &amp; Gift Registry (Optional)</strong>
                            </div>
                            <label htmlFor="wizard-shagunUpi" className={styles.fullField}>
                              UPI ID for Digital Shagun <span>(GPay / PhonePe / Paytm / BHIM)</span>
                              <input
                                id="wizard-shagunUpi"
                                name="shagunUpi"
                                placeholder="e.g. host@okhdfcbank or 9876543210@paytm"
                                value={form.shagunUpi}
                                onChange={(e) => update("shagunUpi", e.target.value.trim())}
                              />
                            </label>
                            <label htmlFor="wizard-registryUrl" className={styles.fullField}>
                              Gift Registry Link <span>(Amazon Wishlist, etc.)</span>
                              <input
                                id="wizard-registryUrl"
                                name="registryUrl"
                                placeholder="https://www.amazon.in/... or wishlist link"
                                value={form.registryUrl}
                                onChange={(e) => update("registryUrl", e.target.value.trim())}
                              />
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <h3>Choose your invitation architecture</h3>
                        <p className={styles.formHint}>Select how your guests experience your celebration story.</p>
                        <div className={styles.designList} style={{ marginBottom: "26px" }}>
                          {ARCHITECTURE_LAYOUTS.map((arch) => (
                            <button
                              key={arch.id}
                              type="button"
                              className={`${styles.designChoice} ${
                                (form.layoutType || "classic") === arch.id ? styles.selectedChoice : ""
                              }`}
                              onClick={() => update("layoutType", arch.id)}
                            >
                              <span
                                style={{
                                  fontSize: "22px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "42px",
                                  height: "42px",
                                  borderRadius: "10px",
                                  background: "#fbf5ea",
                                }}
                              >
                                {arch.icon}
                              </span>
                              <div>
                                <strong>{arch.title}</strong>
                                <small>{arch.desc}</small>
                              </div>
                              {(form.layoutType || "classic") === arch.id && <Check size={16} />}
                            </button>
                          ))}
                        </div>

                        <h3>Choose stationery foil theme</h3>
                        <p className={styles.formHint}>A little visual soul for your big moment.</p>
                        <div className={styles.designList}>
                          {templates.map((name, index) => {
                            const normKey = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                            const swatchClass =
                              (styles as Record<string, string>)[`swatch_${normKey}`] ||
                              (styles as Record<string, string>)[`swatch${index}`];
                            return (
                              <button
                                key={name}
                                type="button"
                                className={`${styles.designChoice} ${template === name ? styles.selectedChoice : ""}`}
                                onClick={() => selectTemplate(name)}
                              >
                                <span className={`${styles.designSwatch} ${swatchClass}`} />
                                <div>
                                  <strong>{name}</strong>
                                  <small>{templateDescriptions[name] || "Warm, timeless & golden"}</small>
                                </div>
                                {template === name && <Check size={16} />}
                              </button>
                            );
                          })}
                        </div>

                        <div className={styles.musicBox}>
                          <div className={styles.musicHeader}>
                            <Volume2 size={16} /> <strong>Curated Background Music</strong>
                            <small>Plays when guests break the wax seal</small>
                          </div>
                          <div className={styles.musicList}>
                            {CURATED_MUSIC.map((track) => {
                              const isSelected = form.musicUrl === track.url;
                              const isPlaying = previewPlaying === track.url;
                              return (
                                <div
                                  key={track.id}
                                  className={`${styles.musicItem} ${
                                    isSelected ? styles.selectedMusicItem : ""
                                  }`}
                                  onClick={() => update("musicUrl", track.url)}
                                  role="button"
                                  tabIndex={0}
                                >
                                  <button
                                    type="button"
                                    className={styles.musicPlayBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      togglePreviewAudio(track.url);
                                    }}
                                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                                  >
                                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                  </button>
                                  <div className={styles.musicInfo}>
                                    <strong>{track.title}</strong>
                                    <span>{track.tag}</span>
                                  </div>
                                  {isSelected && <Check size={16} className={styles.musicCheck} />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {step === 4 && (
                      <div className={styles.reviewSummaryWrap}>
                        <h3>One last look</h3>
                        <p className={styles.formHint}>Review your celebration details before publishing your live link.</p>

                        <div className={styles.reviewCard}>
                          <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Honoring</span>
                            <strong className={styles.reviewValue}>
                              {form.eventType === "Birthday"
                                ? form.firstName || "Celebrant"
                                : form.firstName && form.secondName
                                  ? `${form.firstName} & ${form.secondName}`
                                  : form.firstName || form.secondName || "Celebrants"}
                            </strong>
                          </div>

                          <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Celebration</span>
                            <span className={styles.reviewValue}>
                              {form.eventType} · {template} Foil
                            </span>
                          </div>

                          <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Date &amp; Time</span>
                            <span className={styles.reviewValue}>
                              {prettyDate(form.date)} {form.time ? `· ${timeLabel(form.time)}` : ""}
                            </span>
                          </div>

                          <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Venue</span>
                            <span className={styles.reviewValue}>
                              {form.venue.trim() || "Venue not set"}
                              {form.address && (
                                <small className={styles.reviewSubAddress}>{form.address}</small>
                              )}
                            </span>
                          </div>

                          <div className={styles.reviewRow}>
                            <span className={styles.reviewLabel}>Experience</span>
                            <span className={styles.reviewValue}>
                              {ARCHITECTURE_LAYOUTS.find((a) => a.id === (form.layoutType || "classic"))?.title || "Classic Stationery"} · {CURATED_MUSIC.find((m) => m.url === form.musicUrl)?.title || "Soundtrack"}
                            </span>
                          </div>

                          {form.contact && (
                            <div className={styles.reviewRow}>
                              <span className={styles.reviewLabel}>Contact</span>
                              <span className={styles.reviewValue}>{form.contact}</span>
                            </div>
                          )}

                          {form.shagunUpi && (
                            <div className={styles.reviewRow}>
                              <span className={styles.reviewLabel}>Digital Shagun</span>
                              <span className={styles.reviewValue}>UPI ({form.shagunUpi})</span>
                            </div>
                          )}
                        </div>

                        {/* Dedicated Cover Photo Box in Form Column */}
                        <div className={styles.reviewPhotoBox}>
                          <div className={styles.reviewPhotoHeader}>
                            <div>
                              <strong>Celebration Cover Photo</strong>
                              <small>
                                {form.coverPhotoUrl ? "Personalized backdrop photo attached" : "Add an optional high-resolution couple or venue photo"}
                              </small>
                            </div>
                            <label className={styles.reviewUploadBtn}>
                              {isUploadingPhoto ? "Uploading..." : form.coverPhotoUrl ? "Change Photo" : "+ Add Photo"}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadPhoto(f);
                                }}
                              />
                            </label>
                          </div>
                          {form.coverPhotoUrl && (
                            <div className={styles.reviewPhotoThumb}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={form.coverPhotoUrl} alt="Cover preview" />
                              <span>Backdrop photo attached ✓</span>
                            </div>
                          )}
                        </div>

                        {/* Quick Navigation Adjustments */}
                        <div className={styles.reviewQuickNav}>
                          <span>Need to modify anything?</span>
                          <div className={styles.reviewQuickBtns}>
                            <button type="button" onClick={() => setStep(2)}>
                              ✏️ Edit Details (Step 2)
                            </button>
                            <button type="button" onClick={() => setStep(3)}>
                              🎨 Change Theme &amp; Music (Step 3)
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.previewColumn}>
                    <div className={styles.previewLabel}>
                      <span>LIVE PREVIEW</span>
                      <span>
                        <Sparkles size={12} /> Updates as you type
                      </span>
                    </div>
                    <InvitationMock form={form} compact={true} />
                  </div>
                </div>

                <div className={styles.wizardFooter}>
                  {step > 1 ? (
                    <button type="button" className={styles.backButton} onClick={() => setStep(step - 1)}>
                      <ChevronLeft size={16} /> Back
                    </button>
                  ) : (
                    <span />
                  )}
                  {publishError && (
                    <p role="alert" style={{ color: "#c2593f", fontSize: "12px", margin: "0 12px", fontWeight: 500 }}>
                      {publishError}
                    </p>
                  )}
                  {step < 4 ? (
                    <button type="button" className={styles.nextButton} onClick={() => setStep(step + 1)}>
                      Continue <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button type="button" className={styles.publishButton} onClick={publish}>
                      Publish invitation <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isPublishing && (
        <HeartLoader
          variant="fullscreen"
          theme="gold"
          messages={[
            "Binding celebration memories...",
            "Forging your bespoke invitation link...",
            "Sealing stationery with golden foil...",
            "Your celebration is almost live...",
          ]}
          subtext="Crafting your bespoke invitation"
        />
      )}
      {isUploadingPhoto && (
        <HeartLoader
          variant="fullscreen"
          theme="gold"
          size="sm"
          messages={["Uploading celebration photo...", "Polishing image resolution..."]}
          subtext="Please wait a moment"
        />
      )}
    </main>
  );
}
