"use client";

import { CalendarDays, Clock, Heart, MapPin, Sparkles } from "lucide-react";
import styles from "./LuxuryTimeline.module.css";
import type { InviteEvent } from "@/app/invite/[slug]/InviteClient";

export interface LuxuryTimelineProps {
  events: InviteEvent[];
  displayName: string;
  onRsvpEvent: (eventName: string) => void;
  globalDressCode?: string;
}

function getCeremonyIcon(name = ""): string {
  const norm = name.toLowerCase();
  if (norm.includes("haldi") || norm.includes("tel")) return "🪔";
  if (norm.includes("mehendi") || norm.includes("mehndi")) return "🌿";
  if (norm.includes("sangeet") || norm.includes("music") || norm.includes("dance")) return "🎶";
  if (norm.includes("wedding") || norm.includes("muhurtham") || norm.includes("kalyanam") || norm.includes("shaadi") || norm.includes("phera")) return "💍";
  if (norm.includes("reception")) return "👑";
  if (norm.includes("engagement") || norm.includes("roka") || norm.includes("ring")) return "💎";
  if (norm.includes("cocktail") || norm.includes("party") || norm.includes("bachelor")) return "🥂";
  if (norm.includes("puja") || norm.includes("pooja") || norm.includes("havan")) return "🪔";
  return "✦";
}

function dateLabel(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return Number.isNaN(value.getTime())
    ? date
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(value);
}

function timeLabel(time: string) {
  const value = new Date(`2026-01-01T${time || "19:00"}`);
  return Number.isNaN(value.getTime())
    ? time
    : new Intl.DateTimeFormat("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      }).format(value);
}

function calendarValue(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "");
}

function icsText(value: string) {
  return value.replace(/[\\,;\n]/g, (match) => (match === "\n" ? "\\n" : `\\${match}`));
}

export default function LuxuryTimeline({
  events,
  displayName,
  onRsvpEvent,
  globalDressCode,
}: LuxuryTimelineProps) {
  if (!events || events.length === 0) return null;

  function addSingleEventToCalendar(event: InviteEvent) {
    const start = new Date(`${event.date}T${event.time || "19:00"}`);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // 3-hour ceremony window
    const summary = `${displayName} · ${event.name}`;
    const location = `${event.venue}${event.address ? `, ${event.address}` : ""}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TRAXVA//CelebrationEvent//EN",
      "BEGIN:VEVENT",
      `UID:ceremony-${Date.now()}@invite7.in`,
      `DTSTAMP:${calendarValue(new Date())}`,
      `DTSTART:${calendarValue(start)}`,
      `DTEND:${calendarValue(end)}`,
      `SUMMARY:${icsText(summary)}`,
      `LOCATION:${icsText(location)}`,
      `DESCRIPTION:${icsText(`Ceremony celebration for ${displayName}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${event.name.replace(/\s+/g, "_")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className={styles.timelineSection} aria-label="Celebration Schedule">
      <div className={styles.timelineHeader}>
        <div className={styles.timelineKicker}>
          <Sparkles size={12} /> THE CELEBRATION ITINERARY
        </div>
        <h3>Ceremonies &amp; Gatherings</h3>
        <p>Each moment woven together with joy, traditions, and togetherness</p>
      </div>

      <div className={styles.timelineTrack}>
        {events.map((event, idx) => {
          const icon = getCeremonyIcon(event.name);
          const mapsUrl =
            (event as { maps?: string }).maps ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue} ${event.address || ""}`)}`;
          const eventDressCode = (event as { dressCode?: string }).dressCode || globalDressCode;

          return (
            <article key={`${event.name}-${idx}`} className={styles.timelineCard}>
              <div className={styles.nodeMarker} aria-hidden="true">
                <div className={styles.nodeDot} />
              </div>

              <div className={styles.cardTop}>
                <div className={styles.ceremonyBadge}>
                  <span className={styles.ceremonyIcon} aria-hidden="true">
                    {icon}
                  </span>
                  <span>{event.name}</span>
                </div>
                <div className={styles.timePill}>
                  <Clock size={13} />
                  <span>{timeLabel(event.time)}</span>
                </div>
              </div>

              <div className={styles.cardDetails}>
                <div className={styles.detailItem}>
                  <CalendarDays size={18} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Date</span>
                    <strong className={styles.detailValue}>{dateLabel(event.date)}</strong>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <MapPin size={18} />
                  <div className={styles.detailText}>
                    <span className={styles.detailLabel}>Venue</span>
                    <strong className={styles.detailValue}>{event.venue}</strong>
                    {event.address && <span className={styles.detailSub}>{event.address}</span>}
                  </div>
                </div>
              </div>

              {eventDressCode && (
                <div className={styles.dressCodeRow}>
                  <span>✨</span>
                  <span>
                    <strong>Dress Code:</strong> {eventDressCode}
                  </span>
                </div>
              )}

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.primaryActionBtn}`}
                  onClick={() => onRsvpEvent(event.name)}
                >
                  <Heart size={13} /> RSVP for {event.name}
                </button>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.actionBtn}
                >
                  <MapPin size={13} /> View Venue Map ↗
                </a>

                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => addSingleEventToCalendar(event)}
                  title="Add this ceremony to your calendar"
                >
                  <CalendarDays size={13} /> Add to Cal
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

