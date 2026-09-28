import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const { requestId, cancelPath } = (await req.json()) as { requestId?: string; cancelPath?: string };
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_QDRO_PRICE_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const safeCancelPath = cancelPath?.startsWith("/") && !cancelPath.startsWith("//") ? cancelPath : "/qdro-request";

  if (!secretKey || !priceId) {
    return NextResponse.json({
      message:
        "Stripe Checkout is wired but not enabled. Add STRIPE_SECRET_KEY and STRIPE_QDRO_PRICE_ID to create live payment sessions.",
      requestId
    });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
    typescript: true
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { requestId: requestId || "draft" },
    success_url: `${appUrl}/portal?payment=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}${safeCancelPath}?payment=cancelled`
  });

  return NextResponse.json({ url: session.url });
}
