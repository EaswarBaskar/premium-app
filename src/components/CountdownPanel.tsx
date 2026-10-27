"use client";
import React, { useState, useEffect } from "react";
import { EVENTS, EventKey, addToCalendar, shareEvent, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";
import styles from "./CountdownPanel.module.css";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function CountdownPanel({ eventKey }: { eventKey: EventKey }) {
  const ev = EVENTS[eventKey];
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    mins: number;
    secs: number;
    pct: number;
    arrived: boolean;
  } | null>(null);

  useEffect(() => {
    function tick() {
      const now = new Date();
      const diff = ev.date.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0, pct: 100, arrived: true });
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      const totalSpan = ev.date.getTime() - ev.journeyStart.getTime();
      const elapsed = now.getTime() - ev.journeyStart.getTime();
      let pct = totalSpan > 0 ? (elapsed / totalSpan) * 100 : 0;
      pct = Math.max(0, Math.min(100, pct));
      
      setTimeLeft({ days, hours, mins, secs, pct, arrived: false });
    }
    
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [ev]);

  if (!timeLeft) return null;

  return (
    <motion.div
      key={eventKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className={styles.panel}
    >
      <div className={styles.eventDate}>{formatDate(ev.date)}</div>
      
      {timeLeft.arrived ? (
        <div className={styles.arrived}>Today is the day 🎉</div>
      ) : (
        <div className={styles.countdown}>
          <div className={styles.unit}><span className={styles.num}>{timeLeft.days}</span><span className={styles.lbl}>days</span></div>
          <div className={styles.unit}><span className={styles.num}>{pad(timeLeft.hours)}</span><span className={styles.lbl}>hours</span></div>
          <div className={styles.unit}><span className={styles.num}>{pad(timeLeft.mins)}</span><span className={styles.lbl}>min</span></div>
          <div className={styles.unit}><span className={styles.num}>{pad(timeLeft.secs)}</span><span className={styles.lbl}>sec</span></div>
        </div>
      )}

      <div className={styles.progressWrap}>
        <div className={styles.progressNote}>
          {timeLeft.arrived ? "The day has arrived" : `You're ${timeLeft.pct.toFixed(0)}% of the way to ${ev.label.toLowerCase()}`}
        </div>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${timeLeft.pct}%` }} />
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={() => addToCalendar(eventKey)}>Add to calendar</button>
        <button className={`${styles.btn} ${styles.secondary}`} onClick={() => shareEvent(eventKey)}>Share</button>
      </div>
    </motion.div>
  );
}
