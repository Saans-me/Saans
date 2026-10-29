import { Logo } from "./icons";
import s from "./BreathCTA.module.css";

export function BreathCTA() {
  return (
    <section aria-labelledby="cta-title" className={s.section}>
      <div aria-hidden="true" data-parallax="0.04" className={s.backdrop}>
        {[0, 3, 6].map(d => <span key={d} className={s.ring} style={{ animationDelay: `${d}s` }} />)}
        <span className={s.glow} />
        <span className={s.m1} />
        <span className={s.m2} />
        <span className={s.m3} />
        <span className={s.m4} />
      </div>
      <div data-reveal="scale" className={s.content}>
        <Logo width={44} height={48} />
        <h2 id="cta-title" className={s.title}>Take a breath. Then tell us about your day.</h2>
      </div>
    </section>
  );
}
