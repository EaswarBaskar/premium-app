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
  const yearBadge = invite.date ? invite.date.split("-")[0] : new Date().getFullYear();

  return (
    <div className={styles.cartoonShell}>
      {/* 1. Cartoon Stage & Caricature Header */}
      <section className={styles.cartoonStage}>
        <div className={styles.stageRibbon}>
          <Sparkles size={14} /> WE&apos;RE GETTING HITCHED!
        </div>

        <h1 className={styles.cartoonTitle}>{displayName}</h1>
        <p className={styles.cartoonTagline}>
          {invite.message || "Pack your bags, bring your best dance moves, and join us for an unforgettable celebration!"}
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
              JUST HITCHED · {yearBadge}
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
      {targetDate && (
        <CountdownPanel
          targetDate={targetDate}
          title="Celebration Countdown Starts Now!"
          venue={invite.venue}
        />
      )}

      {/* 3. Event Schedule Timeline */}
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

      {/* 4. What to Wear / Host Dress Code (Rendered only if dress code provided) */}
      {invite.dressCode && (
        <section className={styles.dressSection}>
          <div style={{ textAlign: "center" }}>
            <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "28px", color: "#3d2314", margin: "0 0 6px" }}>
              Dress To Impress! 👗👔
            </h2>
            <p style={{ color: "#7a6355", fontSize: "14px", margin: 0 }}>
              Dress code recommended for our celebration:
            </p>
          </div>

          <div style={{ marginTop: "20px", background: "#fff", border: "2px solid #222", borderRadius: "16px", padding: "20px", textAlign: "center", boxShadow: "3px 3px 0 #222" }}>
            <span style={{ fontSize: "26px" }}>✨</span>
            <h3 style={{ margin: "8px 0 4px", fontSize: "18px", color: "#222" }}>{invite.dressCode}</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>Bring your brightest smiles and celebratory spirits!</p>
          </div>
        </section>
      )}
    </div>
  );
}
