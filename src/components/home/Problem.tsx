import styles from "./Problem.module.css";

const STATS = [
  { num: "1 in 5", text: "US adults had a mental illness in 2022.", source: "Source: NIMH", delay: "0" },
  {
    num: "0.75",
    text: "psychiatrists for every 100,000 people in India. The WHO minimum is 3.",
    source: "Source: PIB, 2025",
    delay: "100",
  },
];

/** Home §2: the treatment gap. */
export function Problem() {
  return (
    <section id="problem" data-screen-label="Problem" className={`section ${styles.section}`}>
      <div className="container">
        <p data-reveal="up" className={`eyebrow ${styles.eyebrow}`}>
          Why SAANS
        </p>
        <h2 data-reveal="up" data-reveal-delay="60" className={`h2 ${styles.h2}`}>
          Most people who struggle with their mental health never get help.
        </h2>

        <div data-reveal="up" data-lift className={styles.card}>
          <div className={styles.cardTop}>
            <span className={styles.bigStat} data-count>
              84.5%
            </span>
            <span className={styles.bigStatText}>of people with a mental health condition in India get no treatment.</span>
          </div>
          <div role="img" aria-label="84.5 percent get no treatment, 15.5 percent are treated" className={styles.bar}>
            <span className={styles.barNo} data-grow="x">
              No treatment
            </span>
            <span className={styles.barYes}>Treated</span>
          </div>
          <span className={styles.source}>Source: National Mental Health Survey</span>
        </div>

        <div className={styles.stats}>
          {STATS.map((s) => (
            <div key={s.num} data-reveal="up" data-reveal-delay={s.delay} data-lift className={styles.stat}>
              <span className={styles.statNum} {...(s.num === "0.75" ? { "data-count": "" } : {})}>
                {s.num}
              </span>
              <span className={styles.statBody}>
                <span className={styles.statText}>{s.text}</span>
                <span className={styles.statSource}>{s.source}</span>
              </span>
            </div>
          ))}
        </div>

        <p data-reveal="up" className={styles.closing}>
          And even people in therapy are seen once a week.{" "}
          <span className={styles.closingSoft}>The hard nights happen in between, and nobody sees them.</span>
        </p>
      </div>
    </section>
  );
}
