"use client";

import React, { useEffect, useState } from "react";
import styles from "./HeartLoader.module.css";

export interface HeartLoaderProps {
  /** "fullscreen" for page blocking, "inline" for buttons/chips, "contained" for cards/modal interiors */
  variant?: "fullscreen" | "inline" | "contained";
  /** Size of the beating heart */
  size?: "sm" | "md" | "lg";
  /** An array of messages that cycle smoothly while the operation runs */
  messages?: string[];
  /** Optional static subtext beneath the cycling caption */
  subtext?: string;
  /** Color theme */
  theme?: "gold" | "terracotta" | "royal";
  /** Optional custom class name */
  className?: string;
}

const DEFAULT_MESSAGES = [
  "Sealing with love...",
  "Gathering blessings...",
  "Polishing your stationery...",
  "Almost ready...",
];

export default function HeartLoader({
  variant = "fullscreen",
  size = "md",
  messages = DEFAULT_MESSAGES,
  subtext,
  theme = "gold",
  className = "",
}: HeartLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (!messages || messages.length <= 1) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div
      className={`${styles.loaderContainer} ${styles[variant]} ${styles[theme]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className={`${styles.heartStage} ${styles[size]}`}>
        {/* Concentric Golden Ripple Waves */}
        <div className={`${styles.ripple}`} />
        <div className={`${styles.ripple} ${styles.ripple2}`} />
        <div className={`${styles.ripple} ${styles.ripple3}`} />

        {/* Ambient Golden Sparkles */}
        <span className={`${styles.sparkle} ${styles.s1}`}>✦</span>
        <span className={`${styles.sparkle} ${styles.s2}`}>✧</span>
        <span className={`${styles.sparkle} ${styles.s3}`}>✦</span>

        {/* Beating SVG Heart with Dual-Pulse (Lub-Dub) */}
        <div className={styles.heartPulseBox}>
          <svg
            className={styles.heartSvg}
            viewBox="0 0 32 29.6"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M23.6,0c-3.4,0-6.3,2.7-7.6,5.6C14.7,2.7,11.8,0,8.4,0C3.8,0,0,3.8,0,8.4c0,9.4,16,21.2,16,21.2s16-11.8,16-21.2C32,3.8,28.2,0,23.6,0z" />
          </svg>
        </div>
      </div>

      {messages && messages.length > 0 && (
        <div className={styles.captionArea}>
          <p className={styles.captionText} key={msgIndex}>
            {messages[msgIndex]}
          </p>
          {subtext && <small className={styles.subtext}>{subtext}</small>}
        </div>
      )}
    </div>
  );
}

