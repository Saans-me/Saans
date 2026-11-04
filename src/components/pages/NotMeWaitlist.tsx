"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import inner from "./inner.module.css";
import styles from "./ConfirmWaitlist.module.css";

type State = "loading" | "ready" | "sending" | "done" | "invalid" | "error";

/**
 * Unlike confirming, this takes a press of the button: it deletes data, and email security tools open every
 * link in a message on their own.
 */
export function NotMeWaitlist() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    // The fragment only exists in the browser, so this can't be read during server rendering.
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(t);
    setState(t ? "ready" : "invalid");
  }, []);

  const remove = async () => {
    setState("sending");
    try {
      const r = await fetch("/api/waitlist/not-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(15_000),
      });
      if (r.ok) {
        window.history.replaceState(window.history.state, "", window.location.pathname);
        setState("done");
      } else setState(r.status === 410 || r.status === 400 ? "invalid" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section data-screen-label="Remove address" className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        {(state === "loading" || state === "ready" || state === "sending" || state === "error") && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>Didn&apos;t sign up?</h1>
            <p className={styles.text}>
              Someone may have typed your address by mistake. We&apos;ll delete what was sent with it and never email you again.
            </p>
            {state === "error" && (
              <p role="alert" className="form-error">
                We couldn&apos;t do that just now. Please try again in a few minutes.
              </p>
            )}
            <button type="button" onClick={remove} disabled={state === "loading" || state === "sending"} className="btn btn-primary">
              {state === "sending" ? "Removing…" : "Remove my address"}
            </button>
          </>
        )}
        {state === "done" && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>Done.</h1>
            <p className={styles.text}>Your address is removed, and we won&apos;t email you again. Sorry for the trouble.</p>
            <Link href="/" className="btn btn-primary">
              Back to SAANS
            </Link>
          </>
        )}
        {state === "invalid" && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>Nothing to remove.</h1>
            <p className={styles.text}>This address has already been removed, or this link isn&apos;t complete.</p>
            <Link href="/" className="btn btn-primary">
              Back to SAANS
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
