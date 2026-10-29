import ui from "./ui.module.css";
import s from "./Journey.module.css";

const STEPS: [string, string][] = [
  ["Discover", "Learn what saans offers, at your own pace."],
  ["Set up", "Pick your language, tone and privacy choices."],
  ["Connect", "Start a text or voice conversation."],
  ["Reflect", "Check in, journal or try a calming exercise."],
  ["Personalise", "saans adapts to what you've chosen to share."],
  ["Get more support", "When it would help, saans points you to a professional."],
  ["Consult", "Meet online or in person, where available."],
  ["Continue", "Come back to talk, use your tools, or keep up your care."],
];

// Snake layout: 1–4 left to right on the top row, 5–8 right to left on the bottom row.
const SNAKE: [number, number][] = [[1, 1], [2, 1], [3, 1], [4, 1], [4, 2], [3, 2], [2, 2], [1, 2]];

const num = (i: number) => String(i + 1).padStart(2, "0");
// Steps 6–8 are the professional-care half of the journey.
const dotClass = (i: number) => `${s.dot} ${i >= 5 ? s.dotCare : ""}`;

export function Journey() {
  return (
    <section id="journey" aria-labelledby="journey-title" className={ui.section}>
      <div className={s.head}>
        <div style={{ minWidth: 0 }}>
          <p data-reveal="up" className={ui.eyebrow}>YOUR JOURNEY</p>
          <h2 data-reveal="line" data-reveal-delay="80" id="journey-title" className={ui.h2} style={{ lineHeight: 1.06, maxWidth: 760 }}>
            One place, from first hello to ongoing care.
          </h2>
        </div>
        <div data-reveal="up" data-reveal-delay="160" className={s.legend} />
      </div>

      <div data-reveal="up">
        {/* ≥980px: snake path */}
        <div className={s.wide}>
          <span aria-hidden="true" className={s.pathTop} />
          <span aria-hidden="true" className={s.pathTurn} />
          <span aria-hidden="true" className={s.pathBottomRight} />
          <span aria-hidden="true" className={s.pathBottomLeft} />
          <ol className={s.snake}>
            {STEPS.map(([title, body], i) => (
              <li key={title} style={{ gridColumn: SNAKE[i][0], gridRow: SNAKE[i][1] }} className={s.snakeItem}>
                <span className={dotClass(i)}>{num(i)}</span>
                <strong className={s.snakeTitle}>{title}</strong>
                <span className={s.snakeBody}>{body}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* <980px: vertical list */}
        <div className={s.narrow}>
          <span aria-hidden="true" className={s.rail} />
          <ol className={s.list}>
            {STEPS.map(([title, body], i) => (
              <li key={title} className={s.listItem}>
                <span className={dotClass(i)}>{num(i)}</span>
                <span className={s.listText}>
                  <strong className={s.listTitle}>{title}</strong>
                  <span className={s.listBody}>{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
