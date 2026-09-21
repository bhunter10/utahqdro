import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    requestId?: string;
    envelopeId?: string;
    status?: "sent" | "completed" | "declined" | "voided";
  };

  const db = getAdminDb();
  if (db && body.requestId) {
    await db.collection("requests").doc(body.requestId).set(
      {
        signatureState: body.status === "completed" ? "completed" : "sent",
        status: body.status === "completed" ? "Draft Prepared" : "Sent for Signature",
        docusignEnvelopeId: body.envelopeId || null,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    await db.collection("auditLog").add({
      requestId: body.requestId,
      actor: "docusign",
      action: `signature.${body.status || "event"}`,
      createdAt: new Date().toISOString()
    });
  }

  return NextResponse.json({ received: true });
}
