"use client";

import { useState } from "react";
import { SIZES, type SizeKey } from "@/lib/products";

export default function ProductPurchase({
  slug,
  availableSizes,
}: {
  slug: string;
  availableSizes: typeof SIZES;
}) {
  const [size, setSize] = useState<SizeKey>(availableSizes[0]?.key ?? SIZES[0].key);
  const [loading, setLoading] = useState(false);

  async function handleBuy() {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, size }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      alert("Something went wrong starting checkout.");
    }
  }

  const selected = availableSizes.find((s) => s.key === size) ?? availableSizes[0];
  const hiddenCount = SIZES.length - availableSizes.length;

  return (
    <div>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
        SIZE
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {availableSizes.map((s) => (
          <label
            key={s.key}
            className="mono"
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 14px",
              border: `1px solid ${size === s.key ? "var(--accent)" : "var(--line)"}`,
              cursor: "pointer",
              fontSize: 13,
              color: size === s.key ? "var(--fg)" : "var(--muted)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="radio"
                name="size"
                value={s.key}
                checked={size === s.key}
                onChange={() => setSize(s.key as SizeKey)}
                style={{ accentColor: "var(--accent)" }}
              />
              {s.label}
            </span>
            <span>${(s.priceCents / 100).toFixed(2)}</span>
          </label>
        ))}
      </div>

      {hiddenCount > 0 && (
        <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 20, lineHeight: 1.5 }}>
          Larger sizes aren't offered for this image at full print quality.
        </p>
      )}

      <button
        onClick={handleBuy}
        disabled={loading || !selected}
        className="mono"
        style={{
          width: "100%",
          padding: "16px 24px",
          fontSize: 13,
          letterSpacing: "0.08em",
          background: "var(--fg)",
          color: "var(--bg)",
          border: "none",
          cursor: "pointer",
          marginTop: hiddenCount > 0 ? 0 : 20,
        }}
      >
        {loading ? "REDIRECTING…" : `ORDER — $${((selected?.priceCents ?? 0) / 100).toFixed(2)}`}
      </button>
    </div>
  );
}