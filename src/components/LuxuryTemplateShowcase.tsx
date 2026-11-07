"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import styles from "./LuxuryTemplateShowcase.module.css";

export interface LuxuryTemplateShowcaseProps {
  onSelectTemplate?: (templateName: string) => void;
  onOpenWizard?: () => void;
}

const TEMPLATES = [
  {
    id: "royal-kalyanam",
    templateKey: "Royal Indian",
    badge: "★ Most Popular",
    className: styles.themeRoyalKalyanam,
    crestIcon: "❖",
    kicker: "SHUBH VIVAH · CELEBRATION",
    eyebrow: "Together with their families",
    firstName: "Aarav",
    secondName: "Meera",
    tagline: "Request the honour of your presence & blessings",
    date: "12 · 12 · 2026",
    venue: "The Courtyard Palace, Jaipur",
    title: "Royal Kalyanam",
    category: "Wedding · Festive Gold & Velvet Maroon",
    chips: ["Mandala Trim", "Music Enabled", "Wax Seal"],
    previewSlug: "demo?theme=royalIndian",
  },
  {
    id: "garden-botanical",
    templateKey: "Garden Floral",
    badge: "🌸 Botanical Luxe",
    className: styles.themeGardenBotanical,
    crestIcon: "❀",
    kicker: "A BEAUTIFUL PROMISE",
    eyebrow: "Joyfully invite you to celebrate",
    firstName: "Riya",
    secondName: "Aditya",
    tagline: "For the beginning of our forever",
    date: "18 · 10 · 2026",
    venue: "The Glasshouse Pavilion, Bangalore",
    title: "Garden Botanical",
    category: "Engagement & Reception · Forest Linen",
    chips: ["Laurel Arch", "RSVP Ready", "Dress Code"],
    previewSlug: "demo?theme=gardenFloral",
  },
  {
    id: "midnight-luxe",
    templateKey: "Midnight Luxe",
    badge: "✨ Haute Couture",
    className: styles.themeMidnightLuxe,
    crestIcon: "✧",
    kicker: "BLACK TIE CELEBRATION",
    eyebrow: "An evening under the stars",
    firstName: "Meera",
    secondName: "Kabir",
    tagline: "To honor their union & milestone",
    date: "20 · 11 · 2026",
    venue: "The Grand Ballroom, Mumbai",
    title: "Midnight Luxe",
    category: "Sangeet & Cocktail · Obsidian Noir",
    chips: ["Gold Foil", "3D Particles", "Digital Shagun"],
    previewSlug: "demo?theme=midnightLuxe",
  },
];

export default function LuxuryTemplateShowcase({
  onSelectTemplate,
  onOpenWizard,
}: LuxuryTemplateShowcaseProps) {
  return (
    <section className={styles.showcaseSection} id="templates" aria-label="Curated Luxury Stationery Designs">
      {/* Section Header */}
      <div className={styles.sectionHeader}>
        <div>
          <div className={styles.kicker}>
            <Sparkles size={13} aria-hidden="true" />
            <span>THE TRAXVA COUTURE COLLECTION</span>
          </div>
          <h2>
            Exquisite stationery,<br />
            <em>crafted with feeling.</em>
          </h2>
        </div>
        <button
          type="button"
          className={styles.headerAction}
          onClick={() => (onOpenWizard ? onOpenWizard() : onSelectTemplate?.("Elegant Gold"))}
          style={{ background: "none", border: 0, cursor: "pointer", font: "inherit", padding: 0 }}
        >
          Explore all stationery designs <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>

      {/* 3-Column Luxury Cards */}
      <div className={styles.cardGrid}>
        {TEMPLATES.map((tmpl) => (
          <div key={tmpl.id} className={styles.stationeryWrapper}>
            <div className={`${styles.luxuryCard} ${tmpl.className}`}>
              {/* Inner Foil Stamped Border & Corner Flourishes */}
              <div className={styles.innerBorder} aria-hidden="true">
                <span className={`${styles.cornerFlourish} ${styles.tl}`}>{tmpl.crestIcon}</span>
                <span className={`${styles.cornerFlourish} ${styles.tr}`}>{tmpl.crestIcon}</span>
                <span className={`${styles.cornerFlourish} ${styles.bl}`}>{tmpl.crestIcon}</span>
                <span className={`${styles.cornerFlourish} ${styles.br}`}>{tmpl.crestIcon}</span>
              </div>

              {/* Top Luxury Badge */}
              <div className={styles.topBadge}>{tmpl.badge}</div>

              {/* Card Centerpiece Content */}
              <div className={styles.cardContent}>
                {/* Crest */}
                <div className={styles.cardCrest}>
                  <div className={styles.crestIcon} aria-hidden="true">
                    {tmpl.crestIcon}
                  </div>
                  <span className={styles.cardKicker}>{tmpl.kicker}</span>
                  <p className={styles.cardEyebrow}>{tmpl.eyebrow}</p>
                </div>

                {/* Foil Stamped Couple Names */}
                <div className={styles.cardNamesBox}>
                  <h3 className={styles.cardNames}>
                    {tmpl.firstName} <i className={styles.cardAmpersand}>&amp;</i> {tmpl.secondName}
                  </h3>
                  <p className={styles.cardTagline}>“{tmpl.tagline}”</p>
                </div>

                {/* Footer Details */}
                <div className={styles.cardFooterDetails}>
                  <div className={styles.cardDivider} aria-hidden="true">
                    <span /> {tmpl.crestIcon} <span />
                  </div>
                  <strong className={styles.cardDate}>{tmpl.date}</strong>
                  <span className={styles.cardVenue}>{tmpl.venue}</span>
                </div>
              </div>

              {/* Hover Overlay with Live Actions */}
              <div className={styles.hoverActionOverlay}>
                <Link
                  href={`/invite/${tmpl.previewSlug}`}
                  target="_blank"
                  className={styles.previewActionBtn}
                  aria-label={`Live Guest Preview of ${tmpl.title}`}
                >
                  <ExternalLink size={14} aria-hidden="true" /> Live Guest Preview ↗
                </Link>
                {onSelectTemplate && (
                  <button
                    type="button"
                    className={styles.useTemplateBtn}
                    onClick={() => onSelectTemplate(tmpl.templateKey)}
                  >
                    Select this stationery
                  </button>
                )}
              </div>
            </div>

            {/* Typography metadata below card */}
            <div className={styles.cardMeta}>
              <div>
                <h4 className={styles.metaTitle}>{tmpl.title}</h4>
                <span className={styles.metaCategory}>{tmpl.category}</span>
              </div>
              <div className={styles.featureChips}>
                {tmpl.chips.map((chip) => (
                  <span key={chip} className={styles.featureChip}>
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
