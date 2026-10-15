import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ message: "Sign in before paying." }, { status: 401 });
  const auth = getAdminAuth();
  const db = getAdminDb();
  const stripe = getStripe();
  if (!auth || !db || !stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Your request has been saved as Payment Pending. Credit card payments are not available yet." }, { status: 503 });
  }
  let uid: string;
  try {
    uid = (await auth.verifyIdToken(token)).uid;
  } catch {
    return NextResponse.json({ message: "Sign in again before paying." }, { status: 401 });
  }
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid checkout request." }, { status: 400 });
  }
  const { requestId, amountCents = 55000 } = body || {};
  if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{1,80}$/.test(requestId) || ![27500, 55000].includes(amountCents)) {
    return NextResponse.json({ message: "Select a valid request and payment amount." }, { status: 400 });
  }
  try {
    const snapshot = await db.collection("requests").doc(requestId).get();
    const request = snapshot.data();
    if (!snapshot.exists || request?.ownerUid !== uid) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }
    const paidCents = Number(request.stripePaidAmountCents || 0);
    if (request.paymentState === "paid" || request.paymentState === "waived" || amountCents > 55000 - paidCents) {
      return NextResponse.json({ message: "This amount exceeds the remaining balance." }, { status: 409 });
    }
    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      redirect_on_completion: "if_required",
      integration_identifier: "utahqdro_checkout_jvmkrsqa",
      client_reference_id: requestId,
      metadata: { requestId },
      payment_intent_data: { metadata: { requestId } },
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: amountCents,
          product_data: { name: amountCents === 27500 ? "UtahQDRO half payment" : "UtahQDRO flat fee" }
        },
        quantity: 1
      }],
      return_url: `${appUrl.origin}/portal?payment=returned&request_id=${encodeURIComponent(requestId)}`
    });
    if (!session.client_secret) throw new Error("Missing checkout client secret");
    return NextResponse.json({ clientSecret: session.client_secret, stripeCheckoutSessionId: session.id });
  } catch {
    return NextResponse.json({ message: "Could not start Stripe checkout. Please try again." }, { status: 502 });
  }
}
