"use client";

import React from "react";
import {
  CalendarDays,
  Heart,
  MapPin,
  Gift,
} from "lucide-react";
import styles from "./MagazineEditorialLayout.module.css";
import LuxuryTimeline from "@/components/LuxuryTimeline";
import CountdownPanel from "@/components/CountdownPanel";
import { sanitizeUrl } from "@/lib/sanitize";
import { Invite } from "@/app/invite/[slug]/InviteClient";

export interface MagazineEditorialLayoutProps {
  invite: Invite;
  displayName: string;
  onRsvpClick: () => void;
  onCalendarClick: () => void;
  onShagunClick?: () => void;
  dateLabel: (dateStr: string) => string;
  timeLabel: (timeStr: string) => string;
  targetDate: string;
}

export default function MagazineEditorialLayout({
  invite,
  displayName,
  onRsvpClick,
  onCalendarClick,
  onShagunClick,
  dateLabel,
  timeLabel,
  targetDate,
}: MagazineEditorialLayoutProps) {
  const coverBg = invite.coverPhotoUrl
    ? { backgroundImage: `url(${invite.coverPhotoUrl})` }
    : {
        backgroundImage:
          "linear-gradient(135deg, #1f2421 0%, #111 100%)",
      };

  const weddingYear = invite.date ? invite.date.split("-")[0] : "2026";
  const dressCodeColors = [
    { name: "Champagne Gold", hex: "#dfb76c" },
    { name: "Emerald Noir", hex: "#1f3a2b" },
    { name: "Ivory Velvet", hex: "#f9f6f0" },
    { name: "Onyx Black", hex: "#111111" },
  ];

  return (
    <div className={styles.magazineShell}>
      {/* 1. Haute Couture Magazine Cover */}
      <article className={styles.magazineCover}>
        <div className={styles.mastheadRow}>
          <span>SPECIAL COMMEMORATIVE EDITION</span>
          <span>EST. {weddingYear}</span>
          <span>ISSUE N° 01</span>
        </div>

        <h1 className={styles.mastheadTitle}>THE WEDDING</h1>

        <div className={styles.coverImageArea} style={coverBg}>
          <div className={styles.coverOverlay} />
          <div className={styles.coverHeadline}>
            <span>EXCLUSIVE COUTURE SPREAD</span>
            <h2>{displayName}</h2>
            <p>
              {invite.message ||
                "Two souls uniting under the golden skies, celebrating eternal love, high fashion, and timeless vows."}
            </p>
          </div>
        </div>

        <div className={styles.coverFooter}>
          <div className={styles.barcodeArea}>
            <span>||| | | |||| | ||| |||| |</span>
            <span>{invite.slug || "VOGUE-TRAXVA"}</span>
          </div>
          <div>
            <strong>DATE:</strong> {dateLabel(invite.date)} ·{" "}
            <strong>TIME:</strong> {timeLabel(invite.time)} ·{" "}
            <strong>VENUE:</strong> {invite.venue}
          </div>
          <div>PRICELESS · BY INVITATION ONLY</div>
        </div>
      </article>

      {/* 2. Editorial Spread Section */}
      <section className={styles.spreadSection}>
        <div className={styles.spreadHeading}>
          <span style={{ fontSize: "11px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#888", fontWeight: 700 }}>
            FEATURE ARTICLE · CELEBRATION DISPATCH
          </span>
          <h3>A Modern Love Story in Fine Print</h3>
          <p style={{ fontSize: "14px", color: "#666", margin: 0, fontStyle: "italic" }}>
            Written on the occasion of the union of {displayName}
          </p>
        </div>

        <div className={styles.columnsGrid}>
          <p>
            {invite.firstName} and {invite.secondName} warmly request the honor of your presence as they begin this new chapter. Set against the breathtaking architecture of {invite.venue}, this celebration marks not just an event, but a symphony of traditions re-imagined for the modern connoisseur. Every detail—from bespoke floral installations to curated banquets—has been tailored to make this gathering an unforgettable experience for our cherished guests.
          </p>
          <p>
            Join us for an evening of black-tie elegance, joyful celebrations, and timeless fellowship. Guests are encouraged to immerse themselves in the festivities, share their fondest blessings, and partake in the grand ceremonies that honor both heritage and contemporary grace.
          </p>
        </div>

        {/* Live Countdown in Editorial Style */}
        <div style={{ marginTop: "32px", padding: "20px 0", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
          <CountdownPanel targetDate={targetDate} />
        </div>

        {/* Mood Board Palette */}
        <div className={styles.moodPalette}>
          <h4>ATTIRE &amp; MOOD BOARD PALETTE {invite.dressCode ? `· ${invite.dressCode}` : "· BLACK TIE & LUXE ETHNIC"}</h4>
          <div className={styles.paletteSwatches}>
            {dressCodeColors.map((color) => (
              <div key={color.name} className={styles.swatchItem}>
                <span
                  className={styles.swatchCircle}
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ceremony Itinerary */}
        {invite.events && invite.events.length > 0 && (
          <div style={{ marginTop: "36px" }}>
            <h4 style={{ fontSize: "11px", letterSpacing: "2.5px", textTransform: "uppercase", color: "#666", marginBottom: "18px" }}>
              ITINERARY OF SOIRÉES
            </h4>
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
          </div>
        )}

        {/* Venue Location Details */}
        <div
          style={{
            marginTop: "32px",
            background: "#f9f8f6",
            border: "1px solid #eae6df",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
            <MapPin size={16} /> Destination &amp; Venue
          </div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>{invite.venue}</div>
          <div style={{ fontSize: "13px", color: "#666" }}>{invite.address}</div>
          <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
            <a
              href={sanitizeUrl(invite.maps) || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${invite.venue}, ${invite.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.outlineBtn}
              style={{ fontSize: "11px", padding: "8px 18px" }}
            >
              <MapPin size={13} /> View on Google Maps ↗
            </a>
            {invite.travelInfo && (
              <span style={{ fontSize: "12px", color: "#777", alignSelf: "center" }}>
                ℹ️ {invite.travelInfo}
              </span>
            )}
          </div>
        </div>

        {/* Editorial Action Bar */}
        <div className={styles.editorialActions}>
          <button
            type="button"
            className={styles.blackTieBtn}
            onClick={onRsvpClick}
          >
            <Heart size={14} /> RSVP for the Soirée
          </button>
          <button
            type="button"
            className={styles.outlineBtn}
            onClick={onCalendarClick}
          >
            <CalendarDays size={14} /> Add to Calendar
          </button>
          {invite.shagunUpi && onShagunClick && (
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={onShagunClick}
            >
              <Gift size={14} /> Digital Shagun
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
