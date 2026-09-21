import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: "2025-08-27.basil",
    typescript: true
  });

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const requestId = session.metadata?.requestId;
    const db = getAdminDb();

    if (db && requestId && requestId !== "draft") {
      await db.collection("requests").doc(requestId).set(
        {
          paymentState: "paid",
          status: "Paid",
          updatedAt: new Date().toISOString(),
          stripeSessionId: session.id
        },
        { merge: true }
      );
      await db.collection("auditLog").add({
        requestId,
        actor: "stripe",
        action: "payment.completed",
        createdAt: new Date().toISOString()
      });
    }
  }

  return NextResponse.json({ received: true });
}
