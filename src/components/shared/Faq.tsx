"use client";

import { useState } from "react";
import { FAQ } from "@/lib/content";
import { Icon } from "./Icon";
import styles from "./Faq.module.css";

/**
 * FAQ accordion (reference lines 361–368). One item open at a time; all closed at start.
 * Panel height animates with grid-template-rows 0fr → 1fr; the plus icon rotates 45deg.
 */
export function Faq({
  items = FAQ,
  idPrefix = "faq-",
  className,
}: {
  items?: [string, string][];
  idPrefix?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(-1);

  return (
    <div className={className ? `${styles.list} ${className}` : styles.list}>
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        const id = `${idPrefix}${i}`;
        return (
          <div key={id} className={styles.item}>
            <h2 className={styles.heading}>
              <button
                type="button"
                className={styles.button}
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen((cur) => (cur === i ? -1 : i))}
              >
                <span>{q}</span>
                <span className={styles.plus} data-open={isOpen || undefined}>
                  <Icon name="plus" size={16} strokeWidth={2.4} />
                </span>
              </button>
            </h2>
            <div id={id} className={styles.panel} data-open={isOpen || undefined}>
              <div className={styles.clip}>
                <p className={styles.answer}>{a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
