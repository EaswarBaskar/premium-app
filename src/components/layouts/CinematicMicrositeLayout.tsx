"use client";

import React from "react";
import {
  CalendarDays,
  Heart,
  Hotel,
  MapPin,
  Plane,
  Sparkles,
  Users,
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
  // Extract initials for crest (e.g. "A & P")
  const firstInitial = (invite.firstName || "A")[0].toUpperCase();
  const secondInitial = (invite.secondName || "P")[0].toUpperCase();
  const crest = `${firstInitial} ✦ ${secondInitial}`;

  const heroBgStyle = invite.coverPhotoUrl
    ? { backgroundImage: `url(${invite.coverPhotoUrl})` }
    : { backgroundImage: "radial-gradient(ellipse at top, #2b3e34 0%, #0d1512 100%)" };

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
          <span style={{ fontSize: "12px", letterSpacing: "1px", color: "#dfb76c", fontWeight: 600 }}>
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
      <CountdownPanel targetDate={targetDate} title="Counting Down to the Muhurtham" />

      {/* 3. Chapter: Our Love Story Timeline */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionKicker}>
            <Sparkles size={14} /> CHAPTER BY CHAPTER
          </span>
          <h2>Our Love Story</h2>
          <p>Every great love story starts with a simple moment. Here are the cherished chapters that led us to this forever.</p>
        </div>

        <div className={styles.storyGrid}>
          <div className={styles.storyCard}>
            <span className={styles.storyYearBadge}>2021</span>
            <h3>The Serendipitous Meeting</h3>
            <p>A chance coffee encounter in Mumbai that was only supposed to last twenty minutes turned into four hours of non-stop laughter and stories.</p>
          </div>

          <div className={styles.storyCard}>
            <span className={styles.storyYearBadge}>2023</span>
            <h3>The Jodhpur Proposal</h3>
            <p>Underneath a canopy of stars with the grand Mehrangarh fort glowing in the horizon, a question was asked and an emotional &ldquo;Yes!&rdquo; echoed.</p>
          </div>

          <div className={styles.storyCard}>
            <span className={styles.storyYearBadge}>2026</span>
            <h3>The Grand Beginning</h3>
            <p>Now, surrounded by our beloved family and dearest friends, we step forward together into the most beautiful journey of our lives.</p>
          </div>
        </div>
      </section>

      {/* 4. Multi-Day Event Itinerary (Luxury Timeline) */}
      <LuxuryTimeline
        events={
          invite.events?.length
            ? invite.events
            : [
                {
                  name: invite.eventType || "Wedding Celebration",
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

      {/* 5. Meet the Squad / Bridal Party */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionKicker}>
            <Users size={14} /> THE INNER CIRCLE
          </span>
          <h2>The Bridal Tribe &amp; Groom&apos;s Crew</h2>
          <p>Meet the pillars of love, chaotic dance choreographers, and partners-in-crime making this celebration unforgettable.</p>
        </div>

        <div className={styles.squadGrid}>
          <div className={styles.squadCard}>
            <div className={styles.squadAvatar}>A</div>
            <strong>Ananya Sharma</strong>
            <span className={styles.squadRole}>Maid of Honour</span>
            <small>Keeper of the veil and Chief Sangeet Choreographer</small>
          </div>

          <div className={styles.squadCard}>
            <div className={styles.squadAvatar}>K</div>
            <strong>Karan Malhotra</strong>
            <span className={styles.squadRole}>Best Man</span>
            <small>Guardian of wedding rings &amp; late night baraat hype man</small>
          </div>

          <div className={styles.squadCard}>
            <div className={styles.squadAvatar}>R</div>
            <strong>Rhea Sengupta</strong>
            <span className={styles.squadRole}>Bridesmaid</span>
            <small>Emergency safety-pin captain &amp; cocktail curator</small>
          </div>

          <div className={styles.squadCard}>
            <div className={styles.squadAvatar}>V</div>
            <strong>Varun Kapoor</strong>
            <span className={styles.squadRole}>Groomsman</span>
            <small>Master of ceremony toasts &amp; luxury travel logistics</small>
          </div>
        </div>
      </section>

      {/* 6. Travel & Guest Hospitality Guide */}
      <section className={styles.sectionBlock}>
        <div className={styles.sectionHead}>
          <span className={styles.sectionKicker}>
            <Plane size={14} /> HOSPITALITY &amp; LOGISTICS
          </span>
          <h2>Travel &amp; Stay Guide</h2>
          <p>We want your visit to be comfortable and effortless. Here is everything you need to know for your travel and stay.</p>
        </div>

        <div className={styles.travelGrid}>
          <div className={styles.travelCard}>
            <div className={styles.travelIcon}>
              <Hotel size={22} />
            </div>
            <div className={styles.travelContent}>
              <h3>Resort &amp; Hotel Accommodations</h3>
              <p>Arranged rooms and suites are reserved for out-of-station guests at the heritage pavilion. Complimentary check-in begins at 12:00 PM.</p>
              <a href={sanitizeUrl(invite.maps, "https://maps.google.com") || "https://maps.google.com"} target="_blank" rel="noopener noreferrer" className={styles.travelAction}>
                <MapPin size={14} /> View Hotel Location &amp; Directions →
              </a>
            </div>
          </div>

          <div className={styles.travelCard}>
            <div className={styles.travelIcon}>
              <Plane size={22} />
            </div>
            <div className={styles.travelContent}>
              <h3>Airport &amp; Station Chauffeurs</h3>
              <p>Dedicated luxury airport shuttles and cabs will be operating at 2-hour intervals from the main terminal. Just share your flight details with our family coordinator.</p>
              {invite.shagunUpi && onShagunClick && (
                <button type="button" onClick={onShagunClick} className={styles.travelAction} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  ✦ Send Digital Shagun &amp; Blessing →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
