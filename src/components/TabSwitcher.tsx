"use client";
import React from "react";
import { EventKey } from "@/lib/utils";
import styles from "./TabSwitcher.module.css";

export default function TabSwitcher({
  activeTab,
  setActiveTab,
}: {
  activeTab: EventKey;
  setActiveTab: (k: EventKey) => void;
}) {
  return (
    <div className={styles.tabs} role="tablist">
      <button
        className={`${styles.tab} ${activeTab === "engagement" ? styles.active : ""}`}
        role="tab"
        aria-selected={activeTab === "engagement"}
        onClick={() => setActiveTab("engagement")}
      >
        Engagement
      </button>
      <button
        className={`${styles.tab} ${activeTab === "wedding" ? styles.active : ""}`}
        role="tab"
        aria-selected={activeTab === "wedding"}
        onClick={() => setActiveTab("wedding")}
      >
        Wedding
      </button>
    </div>
  );
}
