"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CalendarDays, Share2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { addToCalendar, shareEvent, formatDate } from "@/lib/utils";
import styles from "./CountdownPanel.module.css";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export interface CountdownPanelProps {
  targetDate?: string;
  title?: string;
  venue?: string;
}

interface TimeLeftState {
  days: number;
  hours: number;
  mins: number;
  secs: number;
  pct: number;
  arrived: boolean;
}

function calculateTimeLeft(destinationDate: Date | null): TimeLeftState | null {
  if (!destinationDate) return null;
  const now = new Date();
  const diff = destinationDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, mins: 0, secs: 0, pct: 100, arrived: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  // 60-day milestone progress
  const journeyStart = new Date(destinationDate.getTime() - 60 * 86400000);
  const totalSpan = destinationDate.getTime() - journeyStart.getTime();
  const elapsed = now.getTime() - journeyStart.getTime();
  let pct = totalSpan > 0 ? (elapsed / totalSpan) * 100 : 0;
  pct = Math.max(0, Math.min(100, pct));

  return { days, hours, mins, secs, pct, arrived: false };
}

export default function CountdownPanel({
  targetDate,
  title,
  venue,
}: CountdownPanelProps) {
  const destinationDate = useMemo(() => {
    if (!targetDate) return null;
    const d = new Date(targetDate.includes("T") ? targetDate : `${targetDate}T12:00:00`);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [targetDate]);

  const celebrationHeading = title || "Counting Down to Forever";
  const dateFormatted = destinationDate ? formatDate(destinationDate) : "Date to be announced";

  const [timeLeft, setTimeLeft] = useState<TimeLeftState | null>(() =>
    calculateTimeLeft(destinationDate)
  );

  useEffect(() => {
    if (!destinationDate) return;

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(destinationDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [destinationDate]);

  if (!destinationDate || !timeLeft) {
    return null;
  }

  const handleCalendar = () => {
    addToCalendar({
      title: celebrationHeading,
      date: destinationDate,
      venue: venue || undefined,
    });
  };

  const handleShare = () => {
    shareEvent({
      title: celebrationHeading,
      date: destinationDate,
    });
  };

  return (
    <motion.section
      key={targetDate}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={styles.panel}
      aria-label="Celebration Countdown"
    >
      <div className={styles.header}>
        <div className={styles.kicker}>
          <Sparkles size={13} aria-hidden="true" /> AUSPICIOUS CELEBRATION
        </div>
        <h3 className={styles.title}>{celebrationHeading}</h3>
        <div className={styles.eventDate}>
          <CalendarDays size={14} aria-hidden="true" /> {dateFormatted}
        </div>
      </div>

      {timeLeft.arrived ? (
        <div className={styles.arrived}>The celebrated day has arrived! 🎉</div>
      ) : (
        <div className={styles.countdown}>
          <div className={styles.unit}>
            <span className={styles.num}>{timeLeft.days}</span>
            <span className={styles.lbl}>Days</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.num}>{pad(timeLeft.hours)}</span>
            <span className={styles.lbl}>Hours</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.num}>{pad(timeLeft.mins)}</span>
            <span className={styles.lbl}>Mins</span>
          </div>
          <div className={styles.unit}>
            <span className={styles.num}>{pad(timeLeft.secs)}</span>
            <span className={styles.lbl}>Secs</span>
          </div>
        </div>
      )}

      <div className={styles.progressWrap}>
        <div className={styles.progressNote}>
          {timeLeft.arrived
            ? "The celebration is underway."
            : `✨ ${timeLeft.pct.toFixed(0)}% of the countdown milestone reached`}
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} style={{ width: `${timeLeft.pct}%` }} />
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.btn}
          onClick={handleCalendar}
        >
          <CalendarDays size={15} /> Add to calendar
        </button>
        <button
          type="button"
          className={`${styles.btn} ${styles.secondary}`}
          onClick={handleShare}
        >
          <Share2 size={15} /> Share with family
        </button>
      </div>
    </motion.section>
  );
}
