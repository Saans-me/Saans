"use client";

import { useModal } from "@/context/ModalContext";
import { useBreath } from "@/hooks/useBreath";
import styles from "./Modal.module.css";

/** Keyed by openId so every open restarts the 60s exercise. */
export function BreathModal() {
  const { openId } = useModal();
  return <Breath key={openId} />;
}

function Breath() {
  const { close, open } = useModal();
  const br = useBreath();

  if (br.done) {
    return (
      <div className={styles.breathDone}>
        <span className={styles.orbSmall} />
        <h2 id="modal-title" className={styles.title}>
          Nice. How do you feel now?
        </h2>
        <div className={styles.feel}>
          <button type="button" onClick={close} className={`btn btn-ghost ${styles.feelBtn}`}>
            Better
          </button>
          <button type="button" onClick={close} className={`btn btn-ghost ${styles.feelBtn}`}>
            Same
          </button>
          <button
            type="button"
            onClick={() => {
              br.stop();
              open("help", { helpNote: true });
            }}
            className={`btn btn-ghost ${styles.feelBtn}`}
          >
            Worse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.breath}>
      <span className={styles.round}>{br.round}</span>
      <div aria-hidden="true" className={styles.orbWrap}>
        <span className={styles.orbRing} />
        <span className={styles.orb} />
        <span className={styles.count}>{br.count}</span>
      </div>
      <h2 id="modal-title" aria-live="polite" className={styles.phase}>
        {br.phase}
      </h2>
      <div className={styles.bar}>
        <span className={styles.barFill} style={{ width: br.pct }} />
      </div>
      <button type="button" onClick={close} className="btn btn-ghost">
        Done
      </button>
    </div>
  );
}
