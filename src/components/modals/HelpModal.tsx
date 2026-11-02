"use client";

import { useModal } from "@/context/ModalContext";
import { Helplines } from "@/components/shared/Helplines";
import styles from "./Modal.module.css";

export function HelpModal() {
  const { helpNote } = useModal();
  return (
    <>
      <div className={styles.helpHead}>
        {helpNote && <p className={styles.helpNote}>It&apos;s okay to reach out.</p>}
        <h2 id="modal-title" className={styles.title}>
          You don&apos;t have to do this alone.
        </h2>
        <p className={styles.sub}>
          If you&apos;re in danger right now, call your local emergency number. These lines are free, confidential and
          staffed by people who care.
        </p>
      </div>
      <Helplines />
    </>
  );
}
