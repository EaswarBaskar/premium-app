"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { RefreshCw, ArrowLeft, AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TRAXVA runtime error caught by boundary:", error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(ellipse at top, #1b2621 0%, #0d1512 100%)",
        color: "#ffffff",
        padding: "24px 16px",
        fontFamily: "var(--font-sans), system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(223, 183, 108, 0.35)",
          borderRadius: "24px",
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "inline-flex", marginBottom: "20px" }}>
          <Image
            src="/images/traxva-logo.png"
            alt="TRAXVA"
            width={100}
            height={28}
            style={{ objectFit: "contain", height: "24px", width: "auto" }}
          />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(209, 88, 73, 0.15)",
            border: "1px solid rgba(209, 88, 73, 0.35)",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#e88074",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "18px",
          }}
        >
          <AlertCircle size={12} /> MOMENT INTERRUPTED
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "30px",
            fontWeight: 400,
            margin: "0 0 12px",
            lineHeight: 1.2,
            color: "#f5eee2",
          }}
        >
          Something paused this experience.
        </h1>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#b0aba2",
            margin: "0 0 32px",
          }}
        >
          A temporary glitch occurred while loading celebration stationery.
          Please try refreshing, or head back to the main entrance.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #dfb76c 0%, #b38838 100%)",
              color: "#1a160d",
              padding: "13px 24px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(223, 183, 108, 0.25)",
            }}
          >
            <RefreshCw size={15} /> Try Reloading
          </button>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "transparent",
              color: "#dfb76c",
              border: "1px solid rgba(223, 183, 108, 0.4)",
              padding: "12px 24px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> Back to Safety
          </Link>
        </div>
      </div>
    </main>
  );
}

