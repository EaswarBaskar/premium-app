"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Heart,
  Sparkles,
} from "lucide-react";
import styles from "./CartoonCaricatureLayout.module.css";
import LuxuryTimeline from "@/components/LuxuryTimeline";
import CountdownPanel from "@/components/CountdownPanel";
import { Invite } from "@/app/invite/[slug]/InviteClient";

export interface CartoonLayoutProps {
  invite: Invite;
  displayName: string;
  onRsvpClick: () => void;
  onCalendarClick: () => void;
  onShagunClick?: () => void;
  dateLabel: (dateStr: string) => string;
  timeLabel: (timeStr: string) => string;
  targetDate: string;
}

export default function CartoonCaricatureLayout({
  invite,
  displayName,
  onRsvpClick,
  onCalendarClick,
  onShagunClick,
  dateLabel,
  timeLabel,
  targetDate,
}: CartoonLayoutProps) {
  const [hasExchangedGarland, setHasExchangedGarland] = useState(false);

  return (
    <div className={styles.cartoonShell}>
      {/* 1. Cartoon Stage & Caricature Header */}
      <section className={styles.cartoonStage}>
        <div className={styles.stageRibbon}>
          <Sparkles size={14} /> WE&apos;RE GETTING HITCHED!
        </div>

        <h1 className={styles.cartoonTitle}>{displayName}</h1>
        <p className={styles.cartoonTagline}>
          Pack your bags, bring your best dance moves, and get ready for the craziest celebration of the year!
        </p>
        <div style={{ display: "inline-flex", gap: "10px", background: "#fff", border: "2px solid #222", padding: "6px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, margin: "10px auto 0", boxShadow: "2px 2px 0 #222" }}>
          <span>📅 {dateLabel(invite.date)}</span>
          <span>·</span>
          <span>⏰ {timeLabel(invite.time)}</span>
        </div>

        {/* 2. The Animated Floral Auto-Rickshaw with Cartoon Couple */}
        <div className={styles.illustrationArea}>
          <div className={styles.autoRickshaw}>
            <div className={styles.autoTopCanopy} />

            {/* Couple in Wedding Attire */}
            <div className={styles.coupleInside}>
              {/* Groom */}
              <div className={styles.cartoonCharacter}>
                <div className={styles.groomKalgi}>✦</div>
                <div className={styles.groomTurban} />
                <div className={styles.charHead}>😎</div>
                <div className={`${styles.charTorso} ${styles.groomSherwani}`} />
              </div>

              {/* Jaimala Garlands (if clicked) */}
              {hasExchangedGarland && (
                <div className={styles.jaimalaGarlandActive}>
                  🌸 🌺 🌸
                </div>
              )}

              {/* Bride */}
              <div className={styles.cartoonCharacter}>
                <div className={styles.brideDupatta} />
                <div className={styles.charHead}>🥰</div>
                <div className={`${styles.charTorso} ${styles.brideLehenga}`} />
              </div>
            </div>

            <div className={styles.autoLicensePlate}>
              JUST HITCHED · {invite.date.split("-")[0] || "2026"}
            </div>
          </div>

          <div className={styles.jaimalaArea}>
            <button
              type="button"
              className={styles.jaimalaBtn}
              onClick={() => setHasExchangedGarland(!hasExchangedGarland)}
            >
              🌸 {hasExchangedGarland ? "Garlands Exchanged! (Tap to Replay)" : "Tap to Exchange Garlands!"} 💐
            </button>
          </div>
        </div>

        <div className={styles.cartoonActions}>
          <button
            type="button"
            className={styles.comicPrimaryBtn}
            onClick={onRsvpClick}
          >
            <Heart size={18} /> I&apos;m Coming! (RSVP)
          </button>
          <button
            type="button"
            className={styles.comicSecondaryBtn}
            onClick={onCalendarClick}
          >
            <CalendarDays size={18} /> Add Date to Calendar
          </button>
          {invite.shagunUpi && onShagunClick && (
            <button
              type="button"
              className={styles.comicSecondaryBtn}
              onClick={onShagunClick}
              style={{ background: "#a8dadc" }}
            >
              🎁 Digital Shagun &amp; Gift
            </button>
          )}
        </div>
      </section>

      {/* 2. Live Countdown */}
      <CountdownPanel targetDate={targetDate} title="Wedding Countdown Starts Now!" />

      {/* 3. Comic "How It Happened" Doodle Strip */}
      <section className={styles.doodleSection}>
        <div className={styles.doodleHead}>
          <h2>How It All Started 💬</h2>
          <p style={{ color: "#7a6355", fontSize: "14px" }}>A 3-step summary of our happily-ever-after adventure.</p>
        </div>

        <div className={styles.doodleGrid}>
          <div className={styles.doodleCard}>
            <div className={styles.doodleEmoji}>☕</div>
            <h3>Chapter 1: The Chai Date</h3>
            <p>They met over masala chai. She ordered samosas, he pretended he liked elaichi, and conversation lasted until the cafe closed.</p>
          </div>

          <div className={styles.doodleCard}>
            <div className={styles.doodleEmoji}>🛵</div>
            <h3>Chapter 2: Road Trips &amp; Maggi</h3>
            <p>Countless scooter rides, burnt midnight Maggi noodles, and realized they couldn&apos;t live without each other&apos;s bad jokes.</p>
          </div>

          <div className={styles.doodleCard}>
            <div className={styles.doodleEmoji}>💍</div>
            <h3>Chapter 3: The Big Question</h3>
            <p>He finally planned the dream proposal, dropped to one knee, and through tears and laughter, she yelled YES!</p>
          </div>
        </div>
      </section>

      {/* 4. Event Schedule Timeline */}
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

      {/* 5. What to Wear / Cartoon Dress Code Swatches */}
      <section className={styles.dressSection}>
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "28px", color: "#3d2314", margin: "0 0 6px" }}>
            Dress To Impress! 👗👔
          </h2>
          <p style={{ color: "#7a6355", fontSize: "14px", margin: 0 }}>
            Here is the festive dress mood board for the celebration days:
          </p>
        </div>

        <div className={styles.dressGrid}>
          <div className={styles.dressCard}>
            <div className={styles.dressIcon}>☀️</div>
            <span>Day 1 · Haldi</span>
            <strong>Yellow Sunshine</strong>
            <small>Bright yellow kurtas, sunny lehengas &amp; marigold vibes.</small>
          </div>

          <div className={styles.dressCard}>
            <div className={styles.dressIcon}>✨</div>
            <span>Day 2 · Sangeet</span>
            <strong>Bollywood Bling</strong>
            <small>Sequins, shimmer, Indo-Western sherwanis &amp; dance shoes!</small>
          </div>

          <div className={styles.dressCard}>
            <div className={styles.dressIcon}>👑</div>
            <span>Day 3 · Muhurtham / Pheras</span>
            <strong>Royal Traditional</strong>
            <small>Kanjivaram silks, royal pastels, turbans &amp; regal ethnic elegance.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
