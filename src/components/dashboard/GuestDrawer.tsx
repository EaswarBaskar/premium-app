"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, PhoneCall, Trash2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./GuestDrawer.module.css";

export type GuestItem = {
  name: string;
  guests: number;
  status: "Confirmed" | "Maybe" | "Declined" | "Pending";
  meal: string;
  group: string;
  phone: string;
  checkedIn: boolean;
  event?: string;
};

export interface GuestDrawerProps {
  guest: GuestItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleCheckIn: (guest: GuestItem) => void;
  onDeleteGuest: (guest: GuestItem) => void;
  slug: string;
  hostTitle: string;
}

function formatWaNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export default function GuestDrawer({
  guest,
  isOpen,
  onClose,
  onToggleCheckIn,
  onDeleteGuest,
  slug,
  hostTitle,
}: GuestDrawerProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!guest) return null;

  const isRsvpRow = guest.phone.startsWith("rsvp:");
  const personalInviteLink = `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${slug}?g=${encodeURIComponent(guest.name)}`;
  const waMessage = `Hi ${guest.name}! You're warmly invited to celebrate ${hostTitle}. View your invitation & RSVP here: ${personalInviteLink}`;

  function handleCopyPersonalLink() {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(personalInviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.drawerBackdrop} onClick={onClose}>
          <motion.aside
            className={styles.drawerSheet}
            onClick={(e) => e.stopPropagation()}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            aria-label={`Guest Details for ${guest.name}`}
          >
            <header className={styles.drawerHeader}>
              <div className={styles.drawerAvatarRow}>
                <div className={styles.drawerAvatar}>
                  {guest.name.slice(0, 1).toUpperCase()}
                </div>
                <div className={styles.drawerTitleBox}>
                  <h2>{guest.name}</h2>
                  <span style={{ fontSize: "12px", color: "#8c8376" }}>
                    {guest.group} · {isRsvpRow ? "Online RSVP Submission" : guest.phone}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </header>

            <div className={styles.drawerBody}>
              {/* Info Grid */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Response Status</span>
                  <span
                    className={styles.infoVal}
                    style={{
                      color:
                        guest.status === "Confirmed"
                          ? "#059669"
                          : guest.status === "Declined"
                          ? "#e11d48"
                          : "#d97706",
                    }}
                  >
                    {guest.status === "Confirmed" ? "✓ Confirmed" : guest.status}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Seats Reserved</span>
                  <span className={styles.infoVal}>
                    {guest.guests} {guest.guests === 1 ? "seat" : "seats"}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Meal Preference</span>
                  <span className={styles.infoVal}>{guest.meal || "Not specified"}</span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Assigned Event</span>
                  <span className={styles.infoVal}>{guest.event || "All Events"}</span>
                </div>
              </div>

              {/* Venue Check-In Card */}
              <div className={styles.checkinCard}>
                <div className={styles.checkinText}>
                  <strong>Venue Door Check-in</strong>
                  <small>Mark when party arrives at the hall</small>
                </div>
                <button
                  type="button"
                  className={`${styles.checkinToggleBtn} ${guest.checkedIn ? styles.btnChecked : styles.btnUnchecked}`}
                  onClick={() => onToggleCheckIn(guest)}
                >
                  {guest.checkedIn ? (
                    <>
                      <Check size={14} /> Checked in
                    </>
                  ) : (
                    "Mark Arrived"
                  )}
                </button>
              </div>

              {/* Action Stack */}
              <div className={styles.actionStack}>
                <span className={styles.actionStackLabel}>Guest Communication</span>

                {!isRsvpRow && (
                  <a
                    href={`https://wa.me/${formatWaNumber(guest.phone)}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.drawerWaBtn}
                  >
                    <MessageCircle size={15} /> Send WhatsApp Invitation
                  </a>
                )}

                {!isRsvpRow && (
                  <a
                    href={`tel:${guest.phone}`}
                    className={styles.drawerCopyBtn}
                    style={{ textDecoration: "none" }}
                  >
                    <PhoneCall size={14} /> Call {guest.name}
                  </a>
                )}

                <button
                  type="button"
                  className={styles.drawerCopyBtn}
                  onClick={handleCopyPersonalLink}
                >
                  <Copy size={14} /> {copiedLink ? "Link Copied to Clipboard! ✓" : "Copy Personal Guest Link"}
                </button>
              </div>

              {/* Delete guest button */}
              <button
                type="button"
                className={styles.drawerDeleteBtn}
                onClick={() => {
                  onDeleteGuest(guest);
                  onClose();
                }}
              >
                <Trash2 size={14} /> Remove Guest from List
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

