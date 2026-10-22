import { getProduct, PRODUCTS } from "@/lib/products";
import { notFound } from "next/navigation";
import ProductPurchase from "./ProductPurchase";
import ImageViewer from "./ImageViewer";
import BackButton from "./BackButton";
import { getAvailableSizes } from "@/lib/print-sizes";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return notFound();
  const index = PRODUCTS.findIndex((p) => p.slug === product.slug);
  const availableSizes = getAvailableSizes(product.imageFile);
  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 32px 120px" }}>
      <BackButton />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: 56,
          marginTop: 32,
        }}
      >
        <ImageViewer src={`/images/${product.imageFile}`} alt={product.title} />

        <div style={{ paddingTop: 8 }}>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
            PL. {String(index + 1).padStart(2, "0")}
          </div>
          <h1 style={{ fontSize: 16, fontWeight: 500, margin: "0 0 20px" }}>
            {product.title}
          </h1>
          <p style={{ color: "var(--muted)", lineHeight: 1.6, marginBottom: 40, fontSize: 17 }}>
            {product.description}
          </p>
          <ProductPurchase slug={product.slug} availableSizes={availableSizes} />
        </div>
      </div>
    </main>
  );
}