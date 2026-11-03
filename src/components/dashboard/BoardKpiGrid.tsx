"use client";

import { CheckCheck, Clock, Eye, MessageCircle, Users } from "lucide-react";
import styles from "./BoardKpiGrid.module.css";

export interface BoardKpiGridProps {
  totalSeats: number;
  confirmedSeats: number;
  pendingCount: number;
  totalGuestsCount: number;
  attendingCount: number;
  declinedCount: number;
  views: number;
  onTriggerBroadcast?: () => void;
}

export default function BoardKpiGrid({
  totalSeats,
  confirmedSeats,
  pendingCount,
  totalGuestsCount,
  attendingCount,
  declinedCount,
  views,
  onTriggerBroadcast,
}: BoardKpiGridProps) {
  const confirmationPct = totalSeats > 0 ? Math.round((confirmedSeats / totalSeats) * 100) : 0;

  return (
    <section className={styles.kpiGrid} aria-label="Celebration Overview Metrics">
      {/* 1. Confirmed Attendance */}
      <article className={styles.kpiCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Confirmed Seats</span>
          <div className={`${styles.cardIcon} ${styles.iconEmerald}`}>
            <CheckCheck size={18} />
          </div>
        </div>
        <div>
          <div className={styles.mainMetric}>
            <span className={styles.metricValue}>{confirmedSeats}</span>
            <span className={styles.metricSub}>/ {totalSeats} seats</span>
          </div>
          <div className={styles.progressBarContainer}>
            <div
              className={`${styles.progressBarFill} ${styles.fillEmerald}`}
              style={{ width: `${Math.min(100, Math.max(confirmationPct, 0))}%` }}
            />
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.badgePill} ${styles.badgeEmerald}`}>
            {confirmationPct}% confirmed
          </span>
          <span>{attendingCount} party RSVPs</span>
        </div>
      </article>

      {/* 2. Pending Replies & Follow-up */}
      <article className={styles.kpiCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Pending Replies</span>
          <div className={`${styles.cardIcon} ${styles.iconAmber}`}>
            <Clock size={18} />
          </div>
        </div>
        <div>
          <div className={styles.mainMetric}>
            <span className={styles.metricValue}>{pendingCount}</span>
            <span className={styles.metricSub}>awaiting response</span>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.badgePill} ${styles.badgeAmber}`}>
            Needs follow-up
          </span>
          {onTriggerBroadcast && (
            <button
              type="button"
              className={styles.actionLink}
              onClick={onTriggerBroadcast}
              title="Open WhatsApp reminder queue"
            >
              <MessageCircle size={12} /> Broadcast →
            </button>
          )}
        </div>
      </article>

      {/* 3. Total Guest Entries */}
      <article className={styles.kpiCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Total Guest List</span>
          <div className={`${styles.cardIcon} ${styles.iconIndigo}`}>
            <Users size={18} />
          </div>
        </div>
        <div>
          <div className={styles.mainMetric}>
            <span className={styles.metricValue}>{totalGuestsCount}</span>
            <span className={styles.metricSub}>contacts</span>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <span className={`${styles.badgePill} ${styles.badgeSlate}`}>
            {totalSeats} total heads
          </span>
          {declinedCount > 0 ? (
            <span style={{ color: "#e11d48" }}>{declinedCount} regrets</span>
          ) : (
            <span>0 regrets</span>
          )}
        </div>
      </article>

      {/* 4. Live Invitation Impressions */}
      <article className={styles.kpiCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>Live Impressions</span>
          <div className={`${styles.cardIcon} ${styles.iconSlate}`}>
            <Eye size={18} />
          </div>
        </div>
        <div>
          <div className={styles.mainMetric}>
            <span className={styles.metricValue}>{views || 0}</span>
            <span className={styles.metricSub}>page views</span>
          </div>
        </div>
        <div className={styles.cardFooter}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <span className={styles.pulseDot} aria-hidden="true" />
            <span style={{ fontSize: "11px", fontWeight: 600, color: "#065f46" }}>Real-time link</span>
          </div>
          <span style={{ color: "#8c8376" }}>Active link</span>
        </div>
      </article>
    </section>
  );
}

