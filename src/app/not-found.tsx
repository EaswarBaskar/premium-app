import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, Send } from "lucide-react";

export default function NotFound() {
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
            background: "rgba(223, 183, 108, 0.12)",
            border: "1px solid rgba(223, 183, 108, 0.35)",
            padding: "5px 14px",
            borderRadius: "999px",
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#dfb76c",
            fontWeight: 700,
            textTransform: "uppercase",
            marginBottom: "18px",
          }}
        >
          <Sparkles size={12} /> INVITATION NOT FOUND
        </div>

        <h1
          style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "32px",
            fontWeight: 400,
            margin: "0 0 12px",
            lineHeight: 1.2,
            color: "#f5eee2",
          }}
        >
          This moment could not be found.
        </h1>

        <p
          style={{
            fontSize: "14px",
            lineHeight: 1.6,
            color: "#b0aba2",
            margin: "0 0 32px",
          }}
        >
          The invitation link may have expired, moved, or was typed incorrectly.
          Please check the URL or create your own bespoke celebration stationery.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Link
            href="/"
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
              textDecoration: "none",
              boxShadow: "0 4px 15px rgba(223, 183, 108, 0.25)",
            }}
          >
            <ArrowLeft size={15} /> Return to Homepage
          </Link>
          <Link
            href="/#wizard"
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
            <Send size={14} /> Create Your Invitation
          </Link>
        </div>
      </div>
    </main>
  );
}

