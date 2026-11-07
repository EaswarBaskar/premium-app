import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Privacy Policy · TRAXVA",
  description: "How TRAXVA handles your celebration information, contact details, and guest RSVP privacy.",
};

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#f7f5f0", color: "#171615", padding: "40px 24px" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <BrandLogo variant="compact" />
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              color: "#a7553f",
              fontWeight: 500,
            }}
          >
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <article style={{ background: "#ffffff", padding: "48px 36px", borderRadius: "16px", border: "1px solid #ded9cf" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#a7553f", marginBottom: "16px", fontSize: "12px", letterSpacing: "1.5px", fontWeight: 700 }}>
            <Shield size={16} /> PRIVACY POLICY
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "36px", marginBottom: "20px" }}>
            Your celebration privacy matters to us.
          </h1>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            Last updated: November 2026. TRAXVA (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a digital invitation product by Eantrax. We take the privacy of hosts and guests seriously.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            1. Information We Collect
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "16px" }}>
            When you create an invitation or submit an RSVP:
          </p>
          <ul style={{ paddingLeft: "20px", color: "#544f49", lineHeight: "1.8", marginBottom: "24px" }}>
            <li>Event details: celebrant names, date, venue address, and personal notes.</li>
            <li>Host contacts: mobile phone/WhatsApp number for delivery and guest management.</li>
            <li>Guest RSVP details: guest names, attendance count, and celebratory wishes.</li>
            <li>Optional payment markers: UPI IDs provided voluntarily for digital Shagun.</li>
          </ul>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            2. How We Use Information
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            Your information is strictly used to render your custom invitation link, collect guest attendance, send optional WhatsApp updates, and enable the host dashboard. We never sell, rent, or trade your data to third parties.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            3. Data Security
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            All transmissions are protected with 256-bit SSL encryption (HTTPS). Passwords and administrative sessions are stored securely using Supabase authentication infrastructure.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            4. Contact
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7" }}>
            Questions regarding this policy can be directed to <a href="mailto:support@traxva.in" style={{ color: "#a7553f", textDecoration: "underline" }}>support@traxva.in</a> or through Eantrax at <a href="https://eantrax.com" target="_blank" rel="noopener noreferrer" style={{ color: "#a7553f", textDecoration: "underline" }}>eantrax.com</a>.
          </p>
        </article>
      </div>
    </main>
  );
}
