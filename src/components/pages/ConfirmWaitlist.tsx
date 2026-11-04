"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ModalButton } from "@/components/shared/Actions";
import inner from "./inner.module.css";
import styles from "./ConfirmWaitlist.module.css";

type State = "confirming" | "done" | "expired" | "error";

/** Survives a reload of this page, once the token has left the address bar. */
const CONFIRMED_FLAG = "saansConfirmed";

async function post(token: string) {
  const r = await fetch("/api/waitlist/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    signal: AbortSignal.timeout(15_000),
  });
  if (r.ok) return "done";
  return r.status === 410 || r.status === 400 ? "expired" : "error";
}

/**
 * Clicking the email's button is the confirmation, so this page confirms as soon as it opens and asks nothing
 * more. The token is in the URL's fragment (never seen by servers or logs), and only this page's script sends it,
 * so a tool that merely fetches the link confirms nothing.
 */
export function ConfirmWaitlist() {
  const [state, setState] = useState<State>("confirming");
  const [token, setToken] = useState("");

  const confirm = useCallback(async (t: string) => {
    setState("confirming");
    let result: State = "error";
    // One quiet second try, so a brief problem never shows.
    for (let attempt = 0; attempt < 2 && result === "error"; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 1500));
      result = await post(t).catch((): State => "error");
    }
    if (result === "done") {
      window.history.replaceState({ ...window.history.state, [CONFIRMED_FLAG]: true }, "", window.location.pathname);
    }
    setState(result);
  }, []);

  useEffect(() => {
    // The fragment only exists in the browser, so this can't be read during server rendering.
    const t = new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "";
    if (t) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setToken(t);
      void confirm(t);
    } else setState(window.history.state?.[CONFIRMED_FLAG] ? "done" : "expired");
  }, [confirm]);

  return (
    <section data-screen-label="Confirm waitlist" className={inner.hero}>
      <div className={`container ${styles.wrap}`}>
        {state === "confirming" && (
          <h1 role="status" className={`${inner.h1} ${styles.h1}`}>
            Confirming your spot…
          </h1>
        )}
        {state === "error" && (
          <>
            <h1 className={`${inner.h1} ${styles.h1}`}>Almost there.</h1>
            <p role="alert" className={styles.text}>
              We couldn&apos;t confirm that just now. Please try again in a few minutes.
            </p>
            <button type="button" onClick={() => confirm(token)} className="btn btn-primary">
              Try again
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
            <h1 className={`${inner.h1} ${styles.h1}`}>This link has expired.</h1>
            <p className={styles.text}>You can join again from here.</p>
            <ModalButton modal="waitlist" className="btn btn-primary">
              Join the waitlist
            </ModalButton>
          </>
        )}
      </div>
    </section>
  );
}
