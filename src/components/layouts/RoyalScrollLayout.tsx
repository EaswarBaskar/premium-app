"use client";

import React from "react";
import {
  CalendarDays,
  Heart,
  Sparkles,
} from "lucide-react";
import styles from "./RoyalScrollLayout.module.css";
import LuxuryTimeline from "@/components/LuxuryTimeline";
import CountdownPanel from "@/components/CountdownPanel";
import { Invite } from "@/app/invite/[slug]/InviteClient";

export interface RoyalScrollLayoutProps {
  invite: Invite;
  displayName: string;
  onRsvpClick: () => void;
  onCalendarClick: () => void;
  onShagunClick?: () => void;
  dateLabel: (dateStr: string) => string;
  timeLabel: (timeStr: string) => string;
  targetDate: string;
}

export default function RoyalScrollLayout({
  invite,
  displayName,
  onRsvpClick,
  onCalendarClick,
  onShagunClick,
  dateLabel,
  timeLabel,
  targetDate,
}: RoyalScrollLayoutProps) {
  return (
    <div className={styles.scrollShell}>
      {/* 1. The Royal Farman Scroll Container */}
      <div className={styles.scrollContainer}>
        {/* Top Gold Carved Roller */}
        <div className={styles.rollerTop}>
          <div className={styles.finialLeft} />
          <div style={{ display: "flex", gap: "8px", color: "#503814", fontSize: "11px", fontWeight: 700, letterSpacing: "2px" }}>
            <span>❖ RAJWADI ROYAL FARMAN ❖</span>
          </div>
          <div className={styles.finialRight} />
        </div>

        {/* The Parchment Body */}
        <div className={styles.parchmentBody}>
          <div className={styles.innerBorder}>
            <span className={`${styles.cornerMotif} ${styles.tl}`}>❧</span>
            <span className={`${styles.cornerMotif} ${styles.tr}`}>☙</span>
            <span className={`${styles.cornerMotif} ${styles.bl}`}>❧</span>
            <span className={`${styles.cornerMotif} ${styles.br}`}>☙</span>

            {/* Sacred Sanskrit Shloka */}
            <div className={styles.shlokaBox}>
              <div className={styles.ganeshaSymbol}>卐 ॐ 卐</div>
              <p className={styles.sanskritText}>
                ॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ ।<br />
                निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥
              </p>
            </div>

            <div className={styles.royalBadge}>
              ROYAL CELEBRATION PROCLAMATION
            </div>

            <h1 className={styles.royalTitle}>{displayName}</h1>

            <p className={styles.royalProclamation}>
              {invite.message ||
                "By the divine grace of the Almighty and the cherished blessings of our revered ancestors, we humbly request the honour of your auspicious presence and heartfelt blessings on this sacred occasion."}
            </p>

            {/* Auspicious Muhurtham Wax Seal */}
            <div className={styles.muhurthamSeal}>
              <div className={styles.muhurthamLine} />
              <div className={styles.sealCircle}>
                <span>❖</span>
                <span>LAGAN</span>
              </div>
              <div className={styles.muhurthamLine} />
            </div>

            {/* Farman Details */}
            <div className={styles.farmanDetails}>
              <p>
                <strong>Auspicious Date:</strong> {dateLabel(invite.date)}
              </p>
              <p>
                <strong>Shubh Muhurtham:</strong> {timeLabel(invite.time)}
              </p>
              <p>
                <strong>Royal Venue:</strong> {invite.venue || "Venue to be announced"}
              </p>
              {invite.address && <small style={{ color: "#77634f" }}>{invite.address}</small>}
            </div>

            <div className={styles.farmanActions}>
              <button
                type="button"
                className={styles.farmanPrimaryBtn}
                onClick={onRsvpClick}
              >
                <Heart size={15} /> Confirm Attendance (RSVP)
              </button>
              <button
                type="button"
                className={styles.farmanSecondaryBtn}
                onClick={onCalendarClick}
              >
                <CalendarDays size={15} /> Add to Calendar
              </button>
              {invite.shagunUpi && onShagunClick && (
                <button
                  type="button"
                  className={styles.farmanSecondaryBtn}
                  onClick={onShagunClick}
                  style={{ background: "#fbf3df", borderColor: "#dfb76c" }}
                >
                  <Sparkles size={15} /> Digital Shagun
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Gold Carved Roller */}
        <div className={styles.rollerBottom}>
          <div className={styles.finialLeft} />
          <div style={{ color: "#503814", fontSize: "10px", letterSpacing: "1.5px" }}>
            <span>॥ सर्वमङ्गलमाङ्गल्ये शिवे सर्वार्थसाधिके ॥</span>
          </div>
          <div className={styles.finialRight} />
        </div>
      </div>

      {/* 2. Live Countdown to the Muhurtham */}
      {targetDate && (
        <CountdownPanel
          targetDate={targetDate}
          title="Auspicious Muhurtham Countdown"
          venue={invite.venue}
        />
      )}

      {/* 3. Detailed Ceremony Timeline */}
      <LuxuryTimeline
        events={
          invite.events?.length
            ? invite.events
            : [
                {
                  name: invite.eventType || "Celebration",
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
    </div>
  );
}
