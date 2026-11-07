"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Heart,
  MapPin,
  Plane,
  Sparkles,
} from "lucide-react";
import styles from "./CinematicMicrositeLayout.module.css";
import LuxuryTimeline from "@/components/LuxuryTimeline";
import CountdownPanel from "@/components/CountdownPanel";
import { sanitizeUrl } from "@/lib/sanitize";
import { Invite } from "@/app/invite/[slug]/InviteClient";

export interface CinematicLayoutProps {
  invite: Invite;
  displayName: string;
  onRsvpClick: () => void;
  onCalendarClick: () => void;
  onShagunClick?: () => void;
  dateLabel: (dateStr: string) => string;
  timeLabel: (timeStr: string) => string;
  targetDate: string;
}

interface Petal {
  id: number;
  left: number;
  emoji: string;
  duration: number;
  delay: number;
  size: number;
  rotate: number;
}

export default function CinematicMicrositeLayout({
  invite,
  displayName,
  onRsvpClick,
  onCalendarClick,
  onShagunClick,
  dateLabel,
  timeLabel,
  targetDate,
}: CinematicLayoutProps) {
  const [petals, setPetals] = useState<Petal[]>([]);

  const triggerFlowerShower = () => {
    const emojis = ["🌸", "🌺", "🌼", "✨", "💐", "🌸", "🌺", "🌼"];
    const generated: Petal[] = Array.from({ length: 28 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 95,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      duration: 2.8 + Math.random() * 1.6,
      delay: Math.random() * 0.7,
      size: Math.floor(22 + Math.random() * 10),
      rotate: Math.random() * 360,
    }));
    setPetals(generated);
    setTimeout(() => {
      setPetals([]);
    }, 4800);
  };

  // Welcome celebration shower on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerFlowerShower();
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  // Extract initials cleanly without assuming hardcoded letters
  const firstInitial = (invite.firstName || "").trim().charAt(0).toUpperCase();
  const secondInitial = (invite.secondName || "").trim().charAt(0).toUpperCase();
  const crest = firstInitial && secondInitial
    ? `${firstInitial} ✦ ${secondInitial}`
    : firstInitial || "✦";

  const heroBgStyle = invite.coverPhotoUrl
    ? { backgroundImage: `url(${invite.coverPhotoUrl})` }
    : { backgroundImage: "radial-gradient(ellipse at 50% 30%, #20352a 0%, #0d1512 100%)" };

  const hasHospitality = Boolean(
    invite.travelInfo || invite.address || invite.venue || invite.maps || (invite.shagunUpi && onShagunClick)
  );

  return (
    <div className={styles.micrositeShell}>
      {/* 1. Cinematic Full-Bleed Hero with Royal Palace Arch & Festive Magic */}
      <header
        className={styles.heroBanner}
        style={heroBgStyle}
      >
        <div className={styles.heroOverlay} />

        {/* Mughal Scalloped Royal Arch & Golden Mandala Artwork */}
        <div className={styles.palaceArchBg} aria-hidden="true">
          {/* Rotating Golden Mandala Halo */}
          <svg className={styles.mandalaHalo} viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="185" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="4 6" opacity="0.35" />
            <circle cx="200" cy="200" r="145" stroke="url(#goldGrad)" strokeWidth="1.5" opacity="0.45" />
            <circle cx="200" cy="200" r="100" stroke="url(#goldGrad)" strokeWidth="1" strokeDasharray="3 3" opacity="0.55" />
            {Array.from({ length: 12 }).map((_, i) => (
              <path
                key={i}
                d="M200 50 C185 95 185 125 200 145 C215 125 215 95 200 50 Z"
                fill="url(#goldGrad)"
                opacity="0.22"
                transform={`rotate(${i * 30} 200 200)`}
              />
            ))}
            {Array.from({ length: 8 }).map((_, i) => (
              <polygon
                key={`s-${i}`}
                points="200,80 204,92 216,92 206,100 210,112 200,104 190,112 194,100 184,92 196,92"
                fill="#dfb76c"
                opacity="0.45"
                transform={`rotate(${i * 45} 200 200)`}
              />
            ))}
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dfb76c" />
                <stop offset="50%" stopColor="#faecd5" />
                <stop offset="100%" stopColor="#b4945b" />
              </linearGradient>
            </defs>
          </svg>

          {/* Mughal Scalloped Royal Arch */}
          <svg className={styles.royalArchSvg} viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none">
            <path
              d="M 50 600 L 50 240 C 50 110, 240 30, 500 30 C 760 30, 950 110, 950 240 L 950 600"
              stroke="url(#archG)"
              strokeWidth="2"
              opacity="0.38"
            />
            <path
              d="M 90 600 L 90 260 C 110 210, 180 180, 260 180 C 330 130, 430 70, 500 70 C 570 70, 670 130, 740 180 C 820 180, 890 210, 910 260 L 910 600"
              stroke="url(#archG)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              opacity="0.28"
            />
            <g opacity="0.65">
              <line x1="180" y1="30" x2="180" y2="140" stroke="#dfb76c" strokeWidth="1" />
              <circle cx="180" cy="146" r="7" fill="url(#archG)" />
              <polygon points="176,154 184,154 180,166" fill="#f59e0b" />
              <line x1="820" y1="30" x2="820" y2="140" stroke="#dfb76c" strokeWidth="1" />
              <circle cx="820" cy="146" r="7" fill="url(#archG)" />
              <polygon points="816,154 824,154 820,166" fill="#f59e0b" />
            </g>
            <defs>
              <linearGradient id="archG" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#dfb76c" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#faecd5" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#dfb76c" stopOpacity="0.15" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Ambient Floating Sparkles Layer */}
        <div className={styles.sparklesLayer} aria-hidden="true">
          <span className={styles.floatingSparkle} style={{ top: "15%", left: "12%", animationDelay: "0s" }}>✦</span>
          <span className={styles.floatingSparkle} style={{ top: "28%", right: "18%", animationDelay: "1.2s", fontSize: "16px" }}>✧</span>
          <span className={styles.floatingSparkle} style={{ top: "65%", left: "8%", animationDelay: "0.8s", fontSize: "20px" }}>✦</span>
          <span className={styles.floatingSparkle} style={{ top: "72%", right: "14%", animationDelay: "2s" }}>✧</span>
          <span className={styles.floatingSparkle} style={{ top: "35%", left: "85%", animationDelay: "1.5s", fontSize: "14px" }}>✦</span>
        </div>

        {/* Interactive Flower Petal Shower */}
        {petals.length > 0 && (
          <div className={styles.petalShowerContainer} aria-hidden="true">
            {petals.map((p) => (
              <span
                key={p.id}
                className={styles.fallingPetal}
                style={{
                  left: `${p.left}%`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`,
                  fontSize: `${p.size}px`,
                }}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        )}

        {/* Header Top Controls */}
        <div className={styles.heroTop}>
          <div className={styles.monogramCrest}>
            <span>{crest}</span>
          </div>

          <button
            type="button"
            className={styles.blessingBtn}
            onClick={triggerFlowerShower}
            aria-label="Shower flower blessings"
          >
            <Sparkles size={14} aria-hidden="true" /> Shower Blessings 🌸
          </button>
        </div>

        {/* Central Hero Headline & Flourish */}
        <div className={styles.heroCenter}>
          <div className={styles.heroKicker}>REQUEST THE PLEASURE OF YOUR BLESSINGS</div>
          <h1 className={styles.heroTitle}>{displayName}</h1>

          <div className={styles.heroFlourish} aria-hidden="true">
            <span className={styles.flourishLine} />
            <span className={styles.flourishMotif}>❖ ✦ ❖</span>
            <span className={styles.flourishLine} />
          </div>

          <p className={styles.heroTagline}>
            {invite.message || "Together with our families, we joyfully invite you to celebrate our union."}
          </p>
        </div>

        {/* Hero Bottom Capsule & CTAs */}
        <div className={styles.heroBottom}>
          <div className={styles.heroDateBadge}>
            <span>CELEBRATION DATE</span>
            <strong>{dateLabel(invite.date)} · {timeLabel(invite.time)}</strong>
          </div>

          <div className={styles.heroCtaBtns}>
            <button
              type="button"
              className={styles.heroPrimaryBtn}
              onClick={onRsvpClick}
            >
              <Heart size={16} /> RSVP to Celebrate
            </button>
            <button
              type="button"
              className={styles.heroSecondaryBtn}
              onClick={onCalendarClick}
            >
              <CalendarDays size={16} /> Add to Calendar
            </button>
          </div>
        </div>
      </header>

      {/* 2. Live Countdown Section */}
      {targetDate && (
        <CountdownPanel
          targetDate={targetDate}
          title={`Counting Down to the Celebration`}
          venue={invite.venue}
        />
      )}

      {/* 3. Host Words / Message Card */}
      {invite.message && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>
              <Sparkles size={14} /> WORDS FROM THE HOST
            </span>
            <h2>With Warmth &amp; Gratitude</h2>
            <p style={{ maxWidth: "680px", margin: "14px auto 0", fontSize: "17px", lineHeight: "1.7", fontStyle: "italic", color: "#473b2f" }}>
              &ldquo;{invite.message}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* 4. Multi-Day Event Itinerary (Luxury Timeline) */}
      <LuxuryTimeline
        events={
          invite.events?.length
            ? invite.events
            : [
                {
                  name: invite.eventType || "Celebration Ceremony",
                  date: invite.date,
                  time: invite.time,
                  venue: invite.venue,
                  address: invite.address,
                },
              ]
        }
        displayName={displayName}
        onRsvpEvent={() => onRsvpClick()}
        globalDressCode={invite.dressCode}
      />

      {/* 5. Travel & Guest Hospitality Guide */}
      {hasHospitality && (
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionKicker}>
              <Plane size={14} /> HOSPITALITY &amp; LOGISTICS
            </span>
            <h2>Travel &amp; Stay Guide</h2>
            <p>Everything you need to know for your travel and arrival at the venue.</p>
          </div>

          <div className={styles.travelGrid}>
            <div className={styles.travelCard}>
              <div className={styles.travelIcon}>
                <MapPin size={22} />
              </div>
              <div className={styles.travelContent}>
                <h3>{invite.venue || "Celebration Venue"}</h3>
                <p>{invite.address || "Please refer to the interactive map for the exact venue directions."}</p>
                <a
                  href={sanitizeUrl(invite.maps, "https://maps.google.com") || "https://maps.google.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.travelAction}
                >
                  <MapPin size={14} /> View Location on Google Maps →
                </a>
              </div>
            </div>

            {(invite.travelInfo || (invite.shagunUpi && onShagunClick)) && (
              <div className={styles.travelCard}>
                <div className={styles.travelIcon}>
                  <Sparkles size={22} />
                </div>
                <div className={styles.travelContent}>
                  <h3>Guest Logistics &amp; Shagun</h3>
                  <p>
                    {invite.travelInfo ||
                      "We look forward to welcoming you with heartfelt warmth. Reach out to the hosts for any stay assistance."}
                  </p>
                  {invite.shagunUpi && onShagunClick && (
                    <button
                      type="button"
                      onClick={onShagunClick}
                      className={styles.travelAction}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                    >
                      ✦ Send Digital Shagun &amp; Blessing →
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
