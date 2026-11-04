"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import {
  X,
  Share2,
  Download,
  Printer,
  Sparkles,
  Smartphone,
  UserCheck,
  Check,
  Copy,
} from "lucide-react";
import { toPng } from "html-to-image";
import styles from "./ExportStudioModal.module.css";
import HeartLoader from "@/components/HeartLoader";
import { Invite } from "@/app/invite/[slug]/InviteClient";

export interface ExportStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  invite: Invite;
  displayName: string;
  slug: string;
}

export default function ExportStudioModal({
  isOpen,
  onClose,
  invite,
  displayName,
  slug,
}: ExportStudioModalProps) {
  const [activeTab, setActiveTab] = useState<"story" | "vip" | "print">("story");
  const [vipGuestName, setVipGuestName] = useState<string>("Mr. & Mrs. Sharma");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const storyCardRef = useRef<HTMLDivElement>(null);
  const vipCardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://traxva.in";
  const baseUrl = `${origin}/invite/${slug}`;
  const vipUrl = `${baseUrl}?guest=${encodeURIComponent(vipGuestName.trim() || "Cherished Guest")}&g=${encodeURIComponent(vipGuestName.trim() || "Cherished Guest")}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(baseUrl)}`;

  async function handleDownloadStory() {
    if (!storyCardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(storyCardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
        cacheBust: false,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${slug}-9x16-story.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export story", err);
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDownloadVipCard() {
    if (!vipCardRef.current) return;
    try {
      setIsExporting(true);
      const dataUrl = await toPng(vipCardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
        cacheBust: false,
        skipFonts: true,
      });
      const link = document.createElement("a");
      link.download = `${slug}-vip-${vipGuestName.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to export VIP card", err);
    } finally {
      setIsExporting(false);
    }
  }

  function handleCopyVipLink() {
    navigator.clipboard.writeText(vipUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2400);
  }

  const waText = encodeURIComponent(
    `Namaste ${vipGuestName || "Ji"}! 🙏\n\n` +
      `We cordially invite you with great joy to the wedding celebration of ${displayName} on ${invite.date}.\n\n` +
      `Please find your personalized royal digital invitation with event schedule, directions & blessings wall here:\n` +
      `${vipUrl}\n\n` +
      `Looking forward to celebrating with you! ✨`
  );

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Loading Overlay */}
        {isExporting && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.92)",
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <HeartLoader
              size="md"
              messages={["Generating High-Res Export..."]}
              subtext="Rendering crisp luxury typography & 300 DPI gold accents"
            />
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.headerIcon}>
              <Sparkles size={18} />
            </div>
            <div>
              <h3>Multi-Format Export Studio</h3>
              <p>Reels, Personalized VIP Guest Passes &amp; Print-Ready Cards</p>
            </div>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close Studio">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabsNav}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "story" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("story")}
          >
            <Smartphone size={16} /> 9:16 Reel / Story
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "vip" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("vip")}
          >
            <UserCheck size={16} /> Personalized VIP Guest Pass
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "print" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("print")}
          >
            <Printer size={16} /> Print-Ready 300 DPI PDF
          </button>
        </div>

        {/* Tab Content Stage */}
        <div className={styles.contentStage}>
          {/* TAB 1: 9:16 Reel Story */}
          {activeTab === "story" && (
            <div className={styles.storyLayout}>
              {/* 9:16 Mockup Frame */}
              <div className={styles.storyMockupFrame}>
                <div
                  ref={storyCardRef}
                  className={styles.storyCanvas}
                  style={
                    invite.coverPhotoUrl
                      ? { backgroundImage: `url(${invite.coverPhotoUrl})` }
                      : { backgroundImage: "linear-gradient(135deg, #1b2621 0%, #0d1512 100%)" }
                  }
                >
                  <div className={styles.storyOverlay} />
                  <div className={styles.storyContent}>
                    <div>
                      <div className={styles.storyKicker}>SAVE THE DATE</div>
                      <div style={{ color: "#dfb76c", fontSize: "16px", margin: "4px 0" }}>✦ ✦ ✦</div>
                    </div>

                    <div>
                      <h2 className={styles.storyTitle}>{displayName}</h2>
                      <div className={styles.storyDateBadge}>
                        {invite.date ? invite.date.split("-").reverse().join(" · ") : "2026"}
                      </div>
                      <div className={styles.storyVenue}>
                        <strong>{invite.venue}</strong>
                        <div style={{ fontSize: "10px", marginTop: "3px", color: "#bbb" }}>
                          {invite.address}
                        </div>
                      </div>
                    </div>

                    <div className={styles.storyBottom}>
                      <div className={styles.storySwipePill}>
                        <Sparkles size={11} color="#9f7431" /> Swipe Up for Wedding Portal
                      </div>
                      <div style={{ fontSize: "9px", color: "#aaa", letterSpacing: "1px" }}>
                        TRAXVA LUXURY INVITATION
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Story Controls */}
              <div className={styles.storyControls}>
                <div className={styles.actionCard}>
                  <h4>📱 Instagram &amp; WhatsApp Story Ready</h4>
                  <p>
                    Download a pixel-perfect 9:16 vertical image designed specifically for Instagram Stories,
                    WhatsApp Status, and reels.
                  </p>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    onClick={handleDownloadStory}
                  >
                    <Download size={15} /> Download 9:16 Story (PNG)
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`Check out our wedding invitation: ${baseUrl}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.btnSecondary}
                  >
                    <Share2 size={15} /> Post to WhatsApp Status
                  </a>
                </div>

                <div style={{ fontSize: "12px", color: "#777", lineHeight: 1.5 }}>
                  💡 <strong>Tip for Hosts:</strong> You can upload this directly to Instagram Stories and add
                  the official &quot;Link Sticker&quot; pointing to your interactive web invitation URL!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIP Guest Stamping */}
          {activeTab === "vip" && (
            <div className={styles.vipLayout}>
              <div className={styles.vipInputGroup}>
                <label htmlFor="vipGuestInput">Enter Guest or Family Name to Stamp:</label>
                <input
                  id="vipGuestInput"
                  type="text"
                  className={styles.vipInput}
                  placeholder="e.g. Mr. & Mrs. Sharma, Rohit & Priya..."
                  value={vipGuestName}
                  onChange={(e) => setVipGuestName(e.target.value)}
                />
              </div>

              {/* VIP Card Preview */}
              <div ref={vipCardRef} className={styles.vipCardPreview}>
                <div className={styles.vipFoilSeal}>
                  <span>👑 VIP CORDIST INVITATION</span>
                </div>
                <div style={{ fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", color: "#d1c7bc" }}>
                  SPECIALLY HONORED GUEST
                </div>
                <div className={styles.vipGuestName}>
                  {vipGuestName.trim() || "Honored Guest"}
                </div>
                <div className={styles.vipMessage}>
                  You are warmly invited to share in the joy and auspicious union of {displayName} on {invite.date} at {invite.venue}.
                </div>
                <div style={{ marginTop: "18px", fontSize: "11px", color: "#dfb76c", letterSpacing: "1px" }}>
                  ✦ ADMIT WITH FAMILY ✦
                </div>
              </div>

              {/* VIP Actions */}
              <div className={styles.vipActions}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleDownloadVipCard}
                >
                  <Download size={15} /> Download VIP Card Image
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={handleCopyVipLink}
                  style={{ marginTop: 0 }}
                >
                  {copiedLink ? <Check size={15} color="#25d366" /> : <Copy size={15} />}
                  {copiedLink ? "Personalized Link Copied!" : "Copy Guest Link"}
                </button>
              </div>

              <div>
                <a
                  href={`https://wa.me/?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.whatsappShareBtn}
                  style={{ width: "100%" }}
                >
                  <Share2 size={15} /> Send Directly on WhatsApp with Custom Message
                </a>
              </div>
            </div>
          )}

          {/* TAB 3: Print-Ready 300 DPI PDF */}
          {activeTab === "print" && (
            <div className={styles.printLayout}>
              <div className={styles.printPreviewStage}>
                <div className={styles.cropGuideNote}>
                  ✂️ Standard A5 / 5×7&quot; Crop Margins · 300 DPI Print Layout
                </div>
                <div className={styles.printCardFrame}>
                  <div style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: "#8a662d", fontWeight: 700 }}>
                    WEDDING CELEBRATION
                  </div>
                  <h2 className={styles.printHeader}>{displayName}</h2>
                  <div style={{ fontSize: "13px", color: "#666", maxWidth: "420px", margin: "10px auto" }}>
                    {invite.message || "Request the honor of your presence to celebrate their wedding."}
                  </div>
                  <div className={styles.printMeta}>
                    <span>📅 {invite.date}</span>
                    <span>⏰ {invite.time || "7:00 PM"}</span>
                  </div>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>
                    📍 {invite.venue} · {invite.address}
                  </div>

                  {/* QR Code */}
                  <div className={styles.printQrArea}>
                    <Image src={qrCodeUrl} alt="Wedding Web Invitation QR Code" width={110} height={110} unoptimized />
                    <span style={{ fontSize: "10px", color: "#777", letterSpacing: "1px" }}>
                      SCAN TO VIEW LIVE SCHEDULE &amp; RSVP
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.printInstructions}>
                🖨️ <strong>Print Studio Guide:</strong> Click &quot;Print / Save PDF&quot; below. In your browser print dialog, set paper size to <strong>A5 or 5×7 inches</strong>, choose <strong>&quot;Background Graphics: ON&quot;</strong>, and select &quot;Save as PDF&quot; or send directly to your color cardstock printer.
              </div>

              <div style={{ display: "flex", gap: "12px", width: "100%", maxWidth: "580px" }}>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => window.print()}
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={onClose}
                  style={{ marginTop: 0 }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
