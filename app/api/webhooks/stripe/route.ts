import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") || "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed"].includes(event.type)) {
    return NextResponse.json({ received: true });
  }
  const session = event.data.object as Stripe.Checkout.Session;
  const requestId = session.metadata?.requestId;
  if (!requestId || !/^[A-Za-z0-9_-]{1,80}$/.test(requestId) || session.mode !== "payment") {
    return NextResponse.json({ error: "Invalid payment reference." }, { status: 400 });
  }
  // Checkout can complete before a delayed bank payment clears.
  if (session.payment_status !== "paid" && event.type !== "checkout.session.async_payment_failed") {
    return NextResponse.json({ received: true });
  }
  const failed = event.type === "checkout.session.async_payment_failed";
  if (!failed && (session.currency !== "usd" || ![27500, 55000].includes(session.amount_total || 0))) {
    return NextResponse.json({ error: "Unexpected payment amount." }, { status: 400 });
  }
  try {
    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Payment storage is unavailable." }, { status: 503 });
    await db.runTransaction(async (transaction) => {
      const requestRef = db.collection("requests").doc(requestId);
      // Deduplicate by session, including distinct events for the same payment.
      const paymentRef = db.collection("stripePayments").doc(session.id);
      const [requestSnapshot, paymentSnapshot] = await Promise.all([transaction.get(requestRef), transaction.get(paymentRef)]);
      if (!requestSnapshot.exists) throw new Error("Request not found");
      if (paymentSnapshot.data()?.state === "paid" || (failed && paymentSnapshot.exists)) return;
      const now = new Date().toISOString();
      transaction.set(paymentRef, { requestId, state: failed ? "failed" : "paid", amountCents: session.amount_total, eventId: event.id, updatedAt: now });
      transaction.set(db.collection("auditLog").doc(event.id), {
        requestId, actor: "stripe", action: failed ? "payment.failed" : "payment.completed", createdAt: now
      });
      if (failed) return;
      const request = requestSnapshot.data()!;
      const total = Number(request.stripePaidAmountCents || 0) + session.amount_total!;
      const paid = total >= 55000;
      const earlyStatuses = ["Payment Pending", "Pending", "1 Approved Info", "1.1 Pmt Req to Party1", "1.2 Pmt Req to Party2"];
      transaction.update(requestRef, {
        stripePaidAmountCents: total,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
        paymentState: request.paymentState === "waived" ? "waived" : paid ? "paid" : "pending",
        ...(paid && earlyStatuses.includes(request.status) ? { status: "2 Paid in Full" } : {}),
        updatedAt: now
      });
    });
    return NextResponse.json({ received: true });
  } catch {
    // Let Stripe retry instead of silently losing payment updates.
    return NextResponse.json({ error: "Could not record payment. Please retry." }, { status: 500 });
  }
}
