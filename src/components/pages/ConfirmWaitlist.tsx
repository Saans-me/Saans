"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ModalButton } from "@/components/shared/Actions";
import inner from "./inner.module.css";
import styles from "./ConfirmWaitlist.module.css";

type State = "loading" | "ready" | "sending" | "done" | "expired" | "error";

/**
 * Opening the link doesn't confirm: email security tools open links on their own. A person presses the
 * button, which sends the token from the URL's fragment (never seen by servers or logs) to the API.
 */
export function ConfirmWaitlist() {
  const [token, setToken] = useState("");
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    // The fragment only exists in the browser, so this can't be read during server rendering.
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToken(t);
    setState(t ? "ready" : "expired");
  }, []);

  const confirm = async () => {
    setState("sending");
    try {
      const r = await fetch("/api/waitlist/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(15_000),
      });
      if (r.ok) {
        window.history.replaceState(null, "", window.location.pathname);
        setState("done");
      } else setState(r.status === 410 || r.status === 400 ? "expired" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section data-screen-label="Confirm waitlist" className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        {(state === "loading" || state === "ready" || state === "sending" || state === "error") && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>One last step.</h1>
            <p className={styles.text}>Confirm your spot on the SAANS waitlist.</p>
            {state === "error" && (
              <p role="alert" className="form-error">
                We couldn&apos;t confirm that just now. Please try again in a few minutes.
              </p>
            )}
            <button type="button" onClick={confirm} disabled={state === "loading" || state === "sending"} className="btn btn-primary">
              {state === "sending" ? "Confirming…" : "Confirm my spot"}
            </button>
          </>
        )}
        {state === "done" && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>You&apos;re on the list.</h1>
            <p className={styles.text}>Thank you. We&apos;ll email you once, when we open. Nothing else.</p>
            <Link href="/" className="btn btn-primary">
              Back to SAANS
            </Link>
          </>
        )}
        {state === "expired" && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>This link has expired or was already used.</h1>
            <p className={styles.text}>If you&apos;ve confirmed already, you&apos;re all set. If not, you can join again.</p>
            <ModalButton modal="waitlist" className="btn btn-primary">
              Join the waitlist
            </ModalButton>
          </>
        )}
      </div>
    </section>
  );
}
