"use client";
import React, { useEffect, useState } from "react";
import styles from "./FloatingPetals.module.css";

export default function FloatingPetals({ count = 10 }: { count?: number }) {
  const [petals, setPetals] = useState<
    { id: number; size: number; left: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion) return;

    const newPetals = Array.from({ length: count }).map((_, i) => ({
      id: i,
      size: 10 + Math.random() * 14,
      left: Math.random() * 100,
      duration: 14 + Math.random() * 14,
      delay: Math.random() * -20,
    }));
    const frame = window.requestAnimationFrame(() => setPetals(newPetals));
    return () => window.cancelAnimationFrame(frame);
  }, [count]);

  return (
    <div className={styles.container} aria-hidden="true">
      {petals.map((p) => (
        <div
          key={p.id}
          className={styles.petal}
          style={{
            width: `${p.size}px`,
            height: `${p.size}px`,
            left: `${p.left}vw`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
