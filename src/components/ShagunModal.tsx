"use client";

import { useId, useMemo, useState } from "react";
import Image from "next/image";
import { Check, Copy, ExternalLink, Gift, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import styles from "./ShagunModal.module.css";

export interface ShagunModalProps {
  isOpen: boolean;
  onClose: () => void;
  upiId: string;
  displayName: string;
  registryUrl?: string;
}

const AUSPICIOUS_AMOUNTS = [
  { value: 501, label: "₹501", tag: "Shubh Aarambh" },
  { value: 1001, label: "₹1,001", tag: "Aashirwad" },
  { value: 2101, label: "₹2,101", tag: "Prem & Shagun" },
  { value: 5001, label: "₹5,001", tag: "Royal Blessing" },
  { value: 11001, label: "₹11,001", tag: "Kalyanam" },
];

export default function ShagunModal({
  isOpen,
  onClose,
  upiId,
  displayName,
  registryUrl,
}: ShagunModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | "custom">(1001);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const titleId = useId();

  const finalAmount = useMemo(() => {
    if (selectedAmount === "custom") {
      const parsed = Number.parseInt(customAmount.replace(/\D/g, ""), 10);
      return Number.isNaN(parsed) || parsed <= 0 ? 1001 : parsed;
    }
    return selectedAmount;
  }, [selectedAmount, customAmount]);

  const upiIntentUrl = useMemo(() => {
    const note = encodeURIComponent("Wedding Shagun & Blessings");
    const name = encodeURIComponent(displayName);
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${name}&am=${finalAmount}&cu=INR&tn=${note}`;
  }, [upiId, displayName, finalAmount]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=1&data=${encodeURIComponent(upiIntentUrl)}`;
  }, [upiIntentUrl]);

  function handleCopy() {
    if (!navigator?.clipboard) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={styles.overlay}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <div className={styles.modalGlow} aria-hidden="true" />
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close Shagun Dialog"
            >
              <X size={16} />
            </button>

            <header className={styles.modalHeader}>
              <div className={styles.kicker}>
                <Gift size={13} />
                <span>DIGITAL SHAGUN & BLESSINGS</span>
              </div>
              <h2 id={titleId}>Send Warm Shagun</h2>
              <p>
                Your loving presence and blessings are the greatest gift. For family and friends wishing to present traditional Shagun digitally:
              </p>
            </header>

            {/* Auspicious Amount Chips */}
            <div className={styles.chipSection}>
              <span className={styles.chipSectionLabel}>Select Auspicious Blessing Amount</span>
              <div className={styles.chipsGrid}>
                {AUSPICIOUS_AMOUNTS.map((item) => {
                  const isActive = selectedAmount === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      className={`${styles.amountChip} ${isActive ? styles.amountChipActive : ""}`}
                      onClick={() => {
                        setSelectedAmount(item.value);
                      }}
                    >
                      <span className={styles.chipValue}>{item.label}</span>
                      <span className={styles.chipTag}>{item.tag}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={`${styles.amountChip} ${selectedAmount === "custom" ? styles.amountChipActive : ""}`}
                  onClick={() => setSelectedAmount("custom")}
                >
                  <span className={styles.chipValue}>Custom</span>
                  <span className={styles.chipTag}>Your Choice</span>
                </button>
              </div>

              {selectedAmount === "custom" && (
                <div className={styles.customAmountBox}>
                  <span className={styles.currencyPrefix}>₹</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Enter amount (e.g. 2501)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className={styles.customAmountInput}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* QR Card with Instant Scanning */}
            <div className={styles.qrCard}>
              <div className={styles.qrWrapper}>
                <Image
                  src={qrCodeUrl}
                  alt={`UPI QR Code for ${displayName}`}
                  width={120}
                  height={120}
                  unoptimized
                  className={styles.qrImage}
                />
              </div>
              <div className={styles.upiInfo}>
                <span className={styles.upiLabel}>Official UPI ID</span>
                <code className={styles.upiIdCode}>{upiId}</code>
                <button
                  type="button"
                  className={styles.copyUpiBtn}
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check size={13} style={{ color: "#22c55e" }} /> Copied! ✓
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy UPI ID
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 1-Tap Payment Intent Launchers for Mobile */}
            <div className={styles.appsGrid}>
              <a
                href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${finalAmount}&cu=INR`}
                className={styles.appPayBtn}
              >
                <span className={styles.appIcon}>🟢</span>
                <span>Google Pay</span>
              </a>
              <a
                href={`phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${finalAmount}&cu=INR`}
                className={styles.appPayBtn}
              >
                <span className={styles.appIcon}>🟣</span>
                <span>PhonePe</span>
              </a>
              <a
                href={`paytmmp://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(displayName)}&am=${finalAmount}&cu=INR`}
                className={styles.appPayBtn}
              >
                <span className={styles.appIcon}>🔵</span>
                <span>Paytm</span>
              </a>
            </div>

            <a
              href={upiIntentUrl}
              className={styles.universalPayBtn}
            >
              <Sparkles size={15} /> Pay ₹{finalAmount.toLocaleString("en-IN")} via Any UPI App →
            </a>

            {registryUrl && (
              <div style={{ marginTop: "14px", textAlign: "center" }}>
                <a
                  href={registryUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "12px",
                    color: "var(--accent, #b4945b)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    textDecoration: "underline",
                  }}
                >
                  Prefer physical gifts? Browse registry <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Cultural significance tooltip */}
            <div className={styles.auspiciousNote}>
              <span>🪔</span>
              <div>
                <strong>The Tradition of ₹1:</strong> In Indian culture, an extra rupee is added so the gift never ends in zero, signifying endless prosperity, blessings, and continuation of joy.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

