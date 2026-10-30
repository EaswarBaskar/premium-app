"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import styles from "./EnvelopeOpening.module.css";
import type { Invite } from "@/app/invite/[slug]/InviteClient";

export interface EnvelopeOpeningProps {
  invite: Invite;
  slug: string;
  guestName?: string;
  theme?: string;
  onOpenComplete: () => void;
  onSkip?: () => void;
}

export default function EnvelopeOpening({
  invite,
  slug,
  guestName,
  theme = "elegantGold",
  onOpenComplete,
  onSkip,
}: EnvelopeOpeningProps) {
  const [openingState, setOpeningState] = useState<"idle" | "sealBroken" | "flapOpen" | "cardRising" | "completed">("idle");
  const audioContextRef = useRef<AudioContext | null>(null);

  const displayName = useMemo(() => {
    if (invite.eventType === "Birthday") return invite.firstName;
    return invite.secondName ? `${invite.firstName} & ${invite.secondName}` : invite.firstName;
  }, [invite.eventType, invite.firstName, invite.secondName]);

  const sealMonogram = useMemo(() => {
    if (invite.eventType === "Birthday") {
      return (invite.firstName || "T")[0].toUpperCase();
    }
    const f = (invite.firstName || "A")[0].toUpperCase();
    const s = (invite.secondName || "P")[0].toUpperCase();
    return `${f} & ${s}`;
  }, [invite.eventType, invite.firstName, invite.secondName]);

  const prettyDate = useMemo(() => {
    if (!invite.date) return "12 December 2026";
    try {
      const d = new Date(`${invite.date}T12:00:00`);
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d);
    } catch {
      return invite.date;
    }
  }, [invite.date]);

  // Gentle luxury chime using browser Web Audio API
  function playWaxBreakChime() {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = ctx;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // 3 harmonic crystalline bell tones
      const notes = [587.33, 739.99, 880.0]; // D5, F#5, A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 1.25);
      });
    } catch (e) {
      console.warn("Audio chime unavailable", e);
    }
  }

  function handleOpen() {
    if (openingState !== "idle") return;

    playWaxBreakChime();
    setOpeningState("sealBroken");

    // Phase 1: Break seal (250ms)
    setTimeout(() => {
      setOpeningState("flapOpen");
    }, 280);

    // Phase 2: Card slides up out of envelope (750ms)
    setTimeout(() => {
      setOpeningState("cardRising");
    }, 720);

    // Phase 3: Transition to full page view (1850ms)
    setTimeout(() => {
      setOpeningState("completed");
      try {
        sessionStorage.setItem(`traxva_opened_${slug}`, "true");
      } catch {}
      onOpenComplete();
    }, 1850);
  }

  return (
    <div className={styles.envelopeOverlay} data-theme={theme} aria-modal="true" role="dialog">
      {/* Background ambient lighting */}
      <div className={styles.ambientBackdrop} />

      {/* Floating Particles in atmosphere */}
      <div className={styles.particlesContainer} aria-hidden="true">
        {Array.from({ length: 18 }).map((_, i) => (
          <span key={i} className={styles.floatingSpeck} style={{ "--idx": i } as React.CSSProperties} />
        ))}
      </div>

      {/* Skip Button */}
      {onSkip && (
        <button
          type="button"
          className={styles.skipBtn}
          onClick={onSkip}
          aria-label="Skip envelope animation"
        >
          Skip <X size={14} />
        </button>
      )}

      {/* Envelope Stage */}
      <div className={`${styles.envelopeStage} ${openingState !== "idle" ? styles.stageOpening : ""}`}>
        {/* Soft golden aura beneath envelope */}
        <div className={styles.envelopeGlow} />

        {/* 3D Envelope Box */}
        <div
          className={`${styles.envelopeBox} ${styles[openingState]}`}
          onClick={openingState === "idle" ? handleOpen : undefined}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleOpen();
            }
          }}
          aria-label="Interactive wedding invitation envelope. Tap to open."
        >
          {/* Back pocket & foil lining */}
          <div className={styles.envelopeBack}>
            <div className={styles.foilLining}>
              <div className={styles.foilPattern} />
            </div>
          </div>

          {/* Invitation Card tucked inside cavity */}
          <div className={`${styles.invitationCard} ${styles[`card_${openingState}`]}`}>
            <div className={styles.cardHeader}>
              <span className={styles.cardEyebrow}>YOU ARE CORDIALLY INVITED</span>
              <div className={styles.cardOrnament}>✦ · ❧ · ✦</div>
            </div>

            <div className={styles.cardBody}>
              <p className={styles.cardCelebrate}>Together with their families</p>
              <h3 className={styles.cardNames}>{displayName}</h3>
              <p className={styles.cardEvent}>
                {invite.eventType === "Birthday"
                  ? `Celebrate ${invite.firstName}'s Birthday`
                  : `Celebrate their ${invite.eventType.toLowerCase()}`}
              </p>
            </div>

            <div className={styles.cardFooter}>
              <div className={styles.cardDate}>{prettyDate}</div>
              <div className={styles.cardVenue}>{invite.venue}</div>
              <span className={styles.cardBrand}>TRAXVA · DIGITAL LUXURY</span>
            </div>
          </div>

          {/* Left & Right front diagonal pockets */}
          <div className={styles.pocketLeft} />
          <div className={styles.pocketRight} />
          <div className={styles.pocketBottom} />

          {/* 3D Top Folding Flap */}
          <div className={`${styles.envelopeFlap} ${styles[`flap_${openingState}`]}`}>
            <div className={styles.flapOuter} />
            <div className={styles.flapInnerFoil}>
              <div className={styles.foilPattern} />
            </div>
          </div>

          {/* Metallic Gold Wax Seal */}
          <div
            className={`${styles.waxSeal} ${openingState !== "idle" ? styles.sealCracked : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
          >
            <div className={styles.sealBevel} />
            <div className={styles.sealGlint} />
            <div className={styles.sealRidge}>
              <span className={styles.sealInitials}>{sealMonogram}</span>
            </div>
            <Sparkles size={11} className={styles.sealSparkle} />
          </div>

          {/* Calligraphic Recipient Tag */}
          <div className={styles.envelopeFace}>
            <span className={styles.faceTag}>SPECIALLY PRESENTED TO</span>
            <p className={styles.faceGuest}>
              {guestName ? `Dear ${guestName}` : "Our Most Honored Guest"}
            </p>
            <div className={styles.faceDivider}>
              <span />
              <i>✦</i>
              <span />
            </div>
          </div>

          {/* Tap Prompt Hint */}
          {openingState === "idle" && (
            <div className={styles.tapPrompt}>
              <span className={styles.tapPill}>
                <span className={styles.tapPulseDot} />
                TAP TO OPEN INVITATION
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

