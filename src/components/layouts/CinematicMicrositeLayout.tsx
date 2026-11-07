"use client";

import React from "react";
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
  // Extract initials cleanly without assuming hardcoded letters
  const firstInitial = (invite.firstName || "").trim().charAt(0).toUpperCase();
  const secondInitial = (invite.secondName || "").trim().charAt(0).toUpperCase();
  const crest = firstInitial && secondInitial
    ? `${firstInitial} ✦ ${secondInitial}`
    : firstInitial || "✦";

  const heroBgStyle = invite.coverPhotoUrl
    ? { backgroundImage: `url(${invite.coverPhotoUrl})` }
    : { backgroundImage: "radial-gradient(ellipse at top, #2b3e34 0%, #0d1512 100%)" };

  const hasHospitality = Boolean(
    invite.travelInfo || invite.address || invite.venue || invite.maps || (invite.shagunUpi && onShagunClick)
  );

  return (
    <div className={styles.micrositeShell}>
      {/* 1. Cinematic Full-Bleed Hero */}
      <header
        className={styles.heroBanner}
        style={heroBgStyle}
      >
        <div className={styles.heroOverlay} />

        <div className={styles.heroTop}>
          <div className={styles.monogramCrest}>
            <span>{crest}</span>
          </div>
          <span style={{ fontSize: "12px", letterSpacing: "1.5px", color: "#dfb76c", fontWeight: 600 }}>
            CELEBRATION MICROSITE
          </span>
        </div>

        <div className={styles.heroCenter}>
          <div className={styles.heroKicker}>REQUEST THE PLEASURE OF YOUR BLESSINGS</div>
          <h1 className={styles.heroTitle}>{displayName}</h1>
          <p className={styles.heroTagline}>
            {invite.message || "Together with our families, we joyfully invite you to celebrate our union."}
          </p>
        </div>

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
