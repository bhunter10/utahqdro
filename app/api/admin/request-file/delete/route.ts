import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getAdminStorageBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminRequest(req, "Firebase Admin Storage is not configured.");
    if (!authResult.ok) return authResult.response;

    const bucket = getAdminStorageBucket();
    if (!bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const body = (await req.json()) as { requestId?: string; fileId?: string };
    const requestId = String(body.requestId || "");
    const fileId = String(body.fileId || "");
    if (!requestId || !fileId) {
      return NextResponse.json({ message: "requestId and fileId are required." }, { status: 400 });
    }

    const requestRef = authResult.db.collection("requests").doc(requestId);
    const snapshot = await requestRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const data = snapshot.data() || {};
    const files = Array.isArray(data.files) ? data.files : [];
    const file = files.find((item) => item?.id === fileId);
    if (!file) {
      return NextResponse.json({ message: "File not found." }, { status: 404 });
    }

    if (!canRemoveFile(file)) {
      return NextResponse.json({ message: "Only internal admin uploads can be removed." }, { status: 403 });
    }

    if (typeof file.storagePath === "string" && file.storagePath) {
      await bucket.file(file.storagePath).delete({ ignoreNotFound: true });
    }

    const nextFiles = files.filter((item) => item?.id !== fileId);
    await requestRef.update({
      files: nextFiles,
      updatedAt: new Date().toISOString()
    });
    const updatedSnapshot = await requestRef.get();

    return NextResponse.json({
      message: "File removed.",
      request: {
        id: updatedSnapshot.id,
        ...updatedSnapshot.data()
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not remove file." },
      { status: 500 }
    );
  }
}

function canRemoveFile(file: { id?: unknown }) {
  const id = typeof file.id === "string" ? file.id : "";
  return (
    id.startsWith("admin-certified_qdro-") ||
    id.startsWith("admin-approval_letter-") ||
    id.startsWith("admin-appearance_of_counsel-") ||
    id.startsWith("admin-withdrawal_of_counsel-")
  );
}
