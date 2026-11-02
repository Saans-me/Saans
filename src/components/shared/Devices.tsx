import Image from "next/image";
import styles from "./Devices.module.css";

/**
 * Laptop frame used across the site (reference: border-radius clamp(12px,1.4vw,18px) top,
 * padding clamp(5px,.7vw,9px), --frame background, base with --base1/--base2 gradient).
 * Screen images are 16:10, anchored top-left.
 */
export function Laptop({
  src,
  alt,
  priority,
  sizes = "(max-width: 900px) 100vw, 820px",
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.laptop} ${className ?? ""}`}>
      <div className={styles.lid}>
        <div className={styles.screen}>
          <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={styles.laptopImg} />
        </div>
      </div>
      <div aria-hidden="true" className={styles.base} />
    </div>
  );
}

/**
 * Phone frame (393×852 aspect). Width is controlled by the parent/className.
 * `variant="hero"` uses the darker #0B0A12 bezel with --dev-shadow (home hero).
 */
export function PhoneFrame({
  src,
  alt,
  priority,
  sizes = "300px",
  className,
  variant = "default",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  variant?: "default" | "hero";
}) {
  return (
    <div className={`${styles.phone} ${variant === "hero" ? styles.phoneHero : ""} ${className ?? ""}`}>
      <div className={styles.phoneScreen}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={styles.phoneImg} />
      </div>
    </div>
  );
}

/**
 * Phone frame holding several screens stacked on top of each other; only `active`
 * is visible and switching crossfades (all screens are loaded up front, so no blink).
 */
export function PhoneStack({
  screens,
  active,
  sizes = "300px",
  className,
}: {
  screens: { src: string; alt: string }[];
  active: number;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`${styles.phone} ${className ?? ""}`}>
      <div className={styles.phoneScreen}>
        {screens.map((s, i) => (
          <Image
            key={s.src}
            src={s.src}
            alt={i === active ? s.alt : ""}
            aria-hidden={i === active ? undefined : true}
            fill
            sizes={sizes}
            className={`${styles.phoneImg} ${styles.stackImg} ${i === active ? styles.stackOn : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
