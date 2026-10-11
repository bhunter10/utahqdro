import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

type SquareWebhookEvent = {
  type?: string;
  data?: {
    object?: {
      payment?: {
        id?: string;
        status?: string;
        note?: string;
      };
      order?: {
        id?: string;
        state?: string;
        reference_id?: string;
        metadata?: Record<string, string>;
      };
    };
  };
};

function timingSafeEqualStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isValidSquareSignature(body: string, signature: string, signatureKey: string, notificationUrl: string) {
  const expected = crypto.createHmac("sha256", signatureKey).update(`${notificationUrl}${body}`).digest("base64");
  return timingSafeEqualStrings(expected, signature);
}

function getRequestId(event: SquareWebhookEvent) {
  const order = event.data?.object?.order;
  if (order?.metadata?.requestId) return order.metadata.requestId;
  if (order?.reference_id) return order.reference_id;

  const note = event.data?.object?.payment?.note || "";
  const match = note.match(/UtahQDRO request ([^;]+)/);
  return match?.[1];
}

function isPaidEvent(event: SquareWebhookEvent) {
  const paymentStatus = event.data?.object?.payment?.status;
  const orderState = event.data?.object?.order?.state;
  return paymentStatus === "COMPLETED" || orderState === "COMPLETED";
}

export async function POST(req: Request) {
  const signatureKey = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_WEBHOOK_NOTIFICATION_URL;

  if (!signatureKey || !notificationUrl) {
    return NextResponse.json({ error: "Square webhook is not configured." }, { status: 503 });
  }

  const body = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  if (!isValidSquareSignature(body, signature, signatureKey, notificationUrl)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(body) as SquareWebhookEvent;
  const requestId = getRequestId(event);
  const db = getAdminDb();
  const paymentId = event.data?.object?.payment?.id;

  if (db && requestId && requestId !== "draft" && isPaidEvent(event)) {
    await db.collection("requests").doc(requestId).set(
      {
        paymentState: "paid",
        status: "2 Paid in Full",
        updatedAt: new Date().toISOString(),
        squarePaymentId: paymentId || null
      },
      { merge: true }
    );
    await db.collection("auditLog").add({
      requestId,
      actor: "square",
      action: "payment.completed",
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ received: true });
}
