import { NextResponse } from "next/server";
import { getAdminAuth, getAdminStorageBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

type DeleteFileRequest = {
  storagePath?: string;
};

export async function POST(req: Request) {
  try {
    const auth = getAdminAuth();
    const bucket = getAdminStorageBucket();
    if (!auth || !bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ message: "Sign in before deleting documents." }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    const body = (await req.json()) as DeleteFileRequest;
    const storagePath = String(body.storagePath || "");
    const userPrefix = `users/${decoded.uid}/requests/`;

    if (!storagePath || !storagePath.startsWith(userPrefix)) {
      return NextResponse.json({ message: "That file does not belong to the signed-in user." }, { status: 403 });
    }

    await bucket.file(storagePath).delete({ ignoreNotFound: true });

    return NextResponse.json({ message: "File deleted." });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete the uploaded file." },
      { status: 500 }
    );
  }
}
