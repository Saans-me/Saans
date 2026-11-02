import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="page-main">
      <section className="container" style={{ paddingTop: "clamp(28px,5vw,72px)", display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
        <p className="eyebrow">404</p>
        <h1 className="h2">This page doesn&apos;t exist.</h1>
        <p className="lead">The link may be old, or the page may have moved.</p>
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
      </section>
    </main>
  );
}
