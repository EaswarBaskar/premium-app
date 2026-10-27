"use client";
import React from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={styles.hero}
    >
      <div className={styles.framePhoto}>
        <Heart className={styles.icon} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className={styles.names}
      >
        Easwar <em>&amp;</em> Pavithra
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        className={styles.tagline}
      >
        alias Harini
      </motion.div>
    </motion.div>
  );
}
