import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export const metadata = {
  title: "Terms of Service · TRAXVA",
  description: "Terms and conditions for creating and hosting digital invitations on TRAXVA.",
};

export default function TermsPage() {
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
            <FileText size={16} /> TERMS OF SERVICE
          </div>
          <h1 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "36px", marginBottom: "20px" }}>
            Terms &amp; Conditions
          </h1>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            Welcome to TRAXVA. By accessing or publishing invitations on this platform, you agree to these Terms of Service.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            1. Service Description
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            TRAXVA offers an online digital stationery and event management suite, including microsites, RSVP collection, and guest coordination tools.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            2. User Content &amp; Conduct
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            Hosts retain ownership of photos, text, and details published in their invitations. You agree not to upload content that infringes copyrights, contains malicious code, or violates applicable Indian or international laws.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            3. Digital Shagun &amp; Third-Party Services
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7", marginBottom: "24px" }}>
            TRAXVA provides UPI deep links for the convenience of guest gifting. All financial transactions occur directly between the guest and host via their respective bank UPI applications (GPay, PhonePe, Paytm, BHIM). TRAXVA is not a payment gateway and charges no transaction commissions.
          </p>

          <h2 style={{ fontFamily: "var(--font-playfair), Georgia, serif", fontSize: "22px", marginTop: "32px", marginBottom: "12px" }}>
            4. Service Availability
          </h2>
          <p style={{ color: "#544f49", lineHeight: "1.7" }}>
            While we strive for 99.9% uptime, we are not liable for temporary service interruptions due to external factors. For assistance, reach us at <a href="mailto:support@traxva.in" style={{ color: "#a7553f", textDecoration: "underline" }}>support@traxva.in</a>.
          </p>
        </article>
      </div>
    </main>
  );
}
