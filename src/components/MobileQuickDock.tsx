"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Gift, Heart, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./MobileQuickDock.module.css";

export interface MobileQuickDockProps {
  onRsvpClick: () => void;
  mapsUrl?: string;
  onCalendarClick: () => void;
  onShagunClick?: () => void;
  hasShagun?: boolean;
  hasRsvpd?: boolean;
  enabled?: boolean;
}

export default function MobileQuickDock({
  onRsvpClick,
  mapsUrl = "https://maps.google.com",
  onCalendarClick,
  onShagunClick,
  hasShagun = false,
  hasRsvpd = false,
  enabled = true,
}: MobileQuickDockProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = () => {
      // Show dock after scrolling down 150px
      if (window.scrollY > 150) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={styles.dockWrapper} aria-label="Quick Actions">
      <AnimatePresence>
        {scrolled && (
          <motion.aside
            className={styles.dockContainer}
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
          >
            <nav className={styles.dockInner}>
              <button
                type="button"
                className={`${styles.dockBtn} ${styles.primaryRsvp}`}
                onClick={onRsvpClick}
                aria-label="Confirm attendance RSVP"
              >
                {!hasRsvpd && <span className={styles.pulseDot} aria-hidden="true" />}
                <Heart size={16} />
                <span>{hasRsvpd ? "RSVP Sent ✓" : "RSVP Now"}</span>
              </button>

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className={styles.dockBtn}
                aria-label="Get Directions to Venue"
              >
                <MapPin size={16} />
                <span>Directions</span>
              </a>

              <button
                type="button"
                className={styles.dockBtn}
                onClick={onCalendarClick}
                aria-label="Add to Calendar"
              >
                <CalendarDays size={16} />
                <span>Calendar</span>
              </button>

              {hasShagun && onShagunClick && (
                <button
                  type="button"
                  className={styles.dockBtn}
                  onClick={onShagunClick}
                  aria-label="Send Digital Shagun or Gift"
                >
                  <Gift size={16} />
                  <span>Shagun</span>
                </button>
              )}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
