import Link from "next/link";

export default function Success() {
  return (
    <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 32px 120px" }}>
      <Link
        href="/"
        className="mono"
        style={{ fontSize: 12, color: "var(--muted)", textDecoration: "none" }}
      >
        ← ARCHIVE
      </Link>

      <div style={{ padding: "100px 0", textAlign: "center" }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 20 }}>
          ORDER CONFIRMED
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 16px" }}>
          Thank you.
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6 }}>
          A confirmation is on its way to your inbox. Your print will ship soon.
        </p>
      </div>
    </main>
  );
}