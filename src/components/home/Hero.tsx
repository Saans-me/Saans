import Image from "next/image";
import { ModalButton, SectionLink } from "@/components/shared/Actions";
import { PhoneFrame } from "@/components/shared/Devices";
import { Icon } from "@/components/shared/Icon";
import styles from "./Hero.module.css";

const TITLE = "Everyone deserves someone to talk to.".split(" ");

/** Home §1: headline, CTAs and the three apps together (cropped by the section bottom). */
export function Hero() {
  return (
    <section data-screen-label="Hero" className={`zoom-lg ${styles.section}`}>
      <div className={styles.inner}>
        {/* Page-load intro: CSS in globals.css ([data-intro]), started by the <head> script once
            the heading font is ready, so nothing flashes or changes shape mid-animation. */}
        <h1 className={`h1 ${styles.title}`}>
          {TITLE.map((w, i) => (
            <span key={i}>
              <span data-intro="word" style={{ "--i": i } as React.CSSProperties}>
                {w}
              </span>
              {i < TITLE.length - 1 ? " " : ""}
            </span>
          ))}
        </h1>
        <p data-intro="up" style={{ "--d": "620ms" } as React.CSSProperties} className={`lead ${styles.lead}`}>
          SAANS listens any hour, by text or voice, in English, Hindi or Hinglish. It learns what helps you, and when
          you need more, connects you to a real professional.
        </p>
        <div data-intro="up" style={{ "--d": "760ms" } as React.CSSProperties} className={styles.actions}>
          <ModalButton modal="waitlist" className="btn btn-primary">
            Join the waitlist
          </ModalButton>
          <SectionLink id="clinicians" className="btn btn-ghost">
            I&apos;m a clinician
          </SectionLink>
          <ModalButton modal="breath" className="btn-link">
            <Icon name="wind" size={18} strokeWidth={1.8} />
            Or try a 1-minute breath
          </ModalButton>
        </div>

        <div
          role="img"
          aria-label="The three SAANS apps: your phone, your therapist's SAANS Pro on a laptop, and your college's SAANS Campus"
          className={styles.stage}
        >
          <div className={styles.laptop} data-parallax="0.04">
            <div data-intro="laptop" style={{ "--d": "900ms" } as React.CSSProperties}>
              <span className={`${styles.label} ${styles.labelTherapist}`}>YOUR THERAPIST</span>
              <div className={styles.lid}>
                <div className={styles.screen}>
                  <Image
                    src="/screens/pro-home.webp"
                    alt=""
                    fill
                    priority
                    sizes="(max-width: 1040px) 68vw, 680px"
                    className={styles.screenImg}
                  />
                </div>
              </div>
              <div className={styles.base} />
            </div>
          </div>
          <div className={styles.phoneLeft} data-parallax="0.14">
            <div data-intro="phoneL" style={{ "--d": "1120ms" } as React.CSSProperties}>
              <span className={`${styles.label} ${styles.labelYou}`}>YOU</span>
              <PhoneFrame src="/screens/app-care.webp" alt="" variant="hero" priority sizes="(max-width: 1040px) 19vw, 190px" />
            </div>
          </div>
          <div className={styles.phoneRight} data-parallax="0.2">
            <div data-intro="phoneR" style={{ "--d": "1240ms" } as React.CSSProperties}>
              <span className={`${styles.label} ${styles.labelCollege}`}>YOUR COLLEGE</span>
              <PhoneFrame
                src="/screens/campus-concern.webp"
                alt=""
                variant="hero"
                priority
                sizes="(max-width: 1040px) 17vw, 170px"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
