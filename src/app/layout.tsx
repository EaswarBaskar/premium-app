import type { Metadata, Viewport } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#171615",
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://traxva.in";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "TRAXVA · Digital invitations, beautifully told",
    template: "%s · TRAXVA",
  },
  description:
    "Design and share bespoke digital invitations with interactive RSVP tracking, guest list management, and 3D celebration moments. A Product by Eantrax.",
  keywords: [
    "digital wedding invitation",
    "online invitations India",
    "wedding RSVP tracker",
    "luxury digital stationery",
    "shagun UPI invitation",
    "Indian wedding e-invites",
  ],
  authors: [{ name: "Eantrax", url: "https://eantrax.com" }],
  creator: "Eantrax",
  publisher: "TRAXVA",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: appUrl,
    siteName: "TRAXVA",
    title: "TRAXVA · Digital invitations, beautifully told",
    description:
      "Craft bespoke digital invitations in minutes. Real-time RSVP tracking, WhatsApp sharing, digital Shagun, and interactive storyboards.",
    images: [
      {
        url: "/images/traxva-logo.png",
        width: 1200,
        height: 630,
        alt: "TRAXVA Luxury Digital Invitations",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRAXVA · Digital invitations, beautifully told",
    description: "Create and share bespoke digital event and wedding invitations with real-time RSVPs.",
    images: ["/images/traxva-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TRAXVA",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${appUrl}/#organization`,
      name: "TRAXVA",
      url: appUrl,
      logo: `${appUrl}/images/traxva-logo.png`,
      parentOrganization: {
        "@type": "Organization",
        name: "Eantrax",
        url: "https://eantrax.com",
      },
    },
    {
      "@type": "WebApplication",
      "@id": `${appUrl}/#webapp`,
      name: "TRAXVA Digital Invitations",
      applicationCategory: "DesignApplication",
      operatingSystem: "All",
      url: appUrl,
      description: "Create and share bespoke luxury digital invitations with real-time RSVP tracking.",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
