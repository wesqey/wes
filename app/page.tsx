import Link from "next/link";
import { PRODUCTS } from "@/lib/products";

export default function Home() {
  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 32px 120px" }}>
      <header style={{ marginBottom: 80, borderBottom: "1px solid var(--line)", paddingBottom: 32 }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
          ARCHIVE
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          columnGap: 40,
          rowGap: 56,
        }}
      >
        {PRODUCTS.map((p, i) => (
          <Link key={p.slug} href={`/product/${p.slug}`} style={{ textDecoration: "none" }}>
            <div
              style={{
                aspectRatio: "4/5",
                position: "relative",
                background: "var(--bg-raised)",
                border: "1px solid var(--line)",
                overflow: "hidden",
              }}
            >
              <img
                src={`/images/${p.imageFile}`}
                alt={p.title}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 14,
              }}
            >
              <span style={{ fontSize: 12 }}>{p.title}</span>
              <span className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                PL. {String(i + 1).padStart(2, "0")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
