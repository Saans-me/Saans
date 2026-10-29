import { Check, Logo } from "./icons";
import ui from "./ui.module.css";
import s from "./Story.module.css";

const PROMISES = ["Always private", "Always in your language", "Always honest about its limits"];

// Six overlapping petals around the centre: [left %, top %, tone]
const PETALS: [number, number, "accent" | "primary"][] = [
  [72, 50, "accent"], [61, 69.05, "primary"], [39, 69.05, "accent"],
  [28, 50, "primary"], [39, 30.95, "accent"], [61, 30.95, "primary"],
];

export function Story() {
  return (
    <section id="story" aria-labelledby="story-title" className={ui.section}>
      <div className={s.head}>
        <p data-reveal="up" className={ui.eyebrow}>OUR STORY</p>
        <h2 data-reveal="line" data-reveal-delay="80" id="story-title" className={ui.h2} style={{ maxWidth: 640 }}>Built for the moments in between.</h2>
      </div>

      <div className={s.stack}>
        <div className={s.row}>
          <div data-reveal="up" className={s.quote}>
            <Logo mono className={s.watermark} />
            <span aria-hidden="true" className={s.mark}>“</span>
            <p className={s.quoteText}>Most hard moments don&apos;t happen in a therapist&apos;s office.</p>
            <span className={s.why}>WHY WE BUILT SAANS</span>
          </div>
          <div data-reveal="up" data-reveal-delay="100" className={s.promise}>
            <span className={s.label}>OUR PROMISE</span>
            <ul className={s.pills}>
              {PROMISES.map(p => (
                <li key={p}><span className={s.check}><Check size={15} sw={2.6} /></span><span>{p}</span></li>
              ))}
            </ul>
          </div>
        </div>

        <div data-reveal="scale" className={s.vision}>
          <span aria-hidden="true" className={s.glow} />
          <div className={s.visionCopy}>
            <span className={s.label}>OUR VISION</span>
            <p className={s.visionText}>A world where no one has to face emotional struggles completely alone.</p>
          </div>
          <div aria-hidden="true" data-parallax="0.03" className={s.flower}>
            <span className={s.flowerDash} />
            <span className={s.flowerTurn}>
              <span className={s.flowerBreathe}>
                {PETALS.map(([l, t, tone], i) => (
                  <span key={i} className={`${s.petal} ${tone === "accent" ? s.petalAccent : s.petalPrimary}`} style={{ left: `${l.toFixed(2)}%`, top: `${t.toFixed(2)}%` }} />
                ))}
              </span>
            </span>
            <span className={s.centre}><Logo width={38} height={42} /></span>
            <span className={s.dotOrange} />
            <span className={s.dotPrimary} />
          </div>
        </div>
      </div>
    </section>
  );
}
