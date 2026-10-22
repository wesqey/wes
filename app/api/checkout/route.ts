import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProduct, getSize } from "@/lib/products";
import { getAvailableSizes } from "@/lib/print-sizes";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { slug, size } = await req.json();

  const product = getProduct(slug);
  const sizeInfo = getSize(size);
  if (!product || !sizeInfo) {
    return NextResponse.json({ error: "Invalid product or size" }, { status: 400 });
  }

  const allowedSizes = getAvailableSizes(product.imageFile);
  if (!allowedSizes.some((s) => s.key === sizeInfo.key)) {
    return NextResponse.json(
      { error: "This size isn't available for this print" },
      { status: 400 }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: sizeInfo.priceCents,
          product_data: {
            name: `${product.title} — ${sizeInfo.label}`,
          },
        },
        quantity: 1,
      },
    ],
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    metadata: {
      slug: product.slug,
      imageFile: product.imageFile,
      title: product.title,
      size: sizeInfo.key,
      sizeLabel: sizeInfo.label,
    },
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
  });

  return NextResponse.json({ url: session.url });
}