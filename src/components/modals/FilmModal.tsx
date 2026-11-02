"use client";

import { useModal } from "@/context/ModalContext";
import styles from "./Modal.module.css";

export const FILM_SRC = "/film/saans-film.mp4";
// Set to "/film/saans-film.vtt" once captions exist (README §9 / §10 placeholders).
export const FILM_CAPTIONS: string | null = null;

export function FilmModal() {
  const { open } = useModal();
  return (
    <>
      <h2 id="modal-title" className={`${styles.title} ${styles.filmTitle}`}>
        SAANS in two minutes
      </h2>
      <video src={FILM_SRC} poster="/film/frame-8.webp" controls autoPlay playsInline className={styles.video}>
        {FILM_CAPTIONS && <track kind="captions" src={FILM_CAPTIONS} srcLang="en" label="English" default />}
      </video>
      <div className={styles.filmFoot}>
        <strong>Like what you see? Join the waitlist.</strong>
        <button type="button" onClick={() => open("waitlist")} className="btn btn-primary">
          Join the waitlist
        </button>
      </div>
    </>
  );
}
