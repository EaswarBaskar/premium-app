import Link from "next/link";
import Image from "next/image";
import styles from "./BrandLogo.module.css";

export type BrandLogoProps = {
  href?: string;
  variant?: "nav" | "footer" | "dashboard" | "admin" | "login" | "invite" | "compact";
  className?: string;
  showProductBy?: boolean;
  extraBadge?: string;
};

export default function BrandLogo({
  href = "/",
  variant = "nav",
  className = "",
  showProductBy = true,
  extraBadge,
}: BrandLogoProps) {
  return (
    <div className={`${styles.brandWrapper} ${styles[variant] || ""} ${className}`}>
      <Link href={href} className={styles.logoLink} aria-label="TRAXVA Homepage">
        <Image
          src="/images/traxva-logo.png"
          alt="TRAXVA"
          width={180}
          height={52}
          priority
          className={styles.traxvaLogo}
        />
        {extraBadge && <span className={styles.adminBadge}>{extraBadge}</span>}
      </Link>

      {showProductBy && (
        <div className={styles.byLockup}>
          <span className={styles.byDivider} aria-hidden="true" />
          <span className={styles.byText}>A Product by</span>
          <a
            href="https://eantrax.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.eantraxLink}
            title="Eantrax"
          >
            <Image
              src="/images/eantrax-logo.png"
              alt="Eantrax"
              width={90}
              height={13}
              className={styles.eantraxLogo}
            />
          </a>
        </div>
      )}
    </div>
  );
}

