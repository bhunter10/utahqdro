import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-access";
import { getAdminAuth, getAdminDb, getAdminStorageBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    const bucket = getAdminStorageBucket();
    if (!auth || !db || !bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ message: "Admin sign-in is required." }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    if (!(await isAdminUser(decoded, db))) {
      return NextResponse.json({ message: "Admin access is required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId") || "";
    const fileId = searchParams.get("fileId") || "";
    if (!requestId || !fileId) {
      return NextResponse.json({ message: "requestId and fileId are required." }, { status: 400 });
    }

    const snapshot = await db.collection("requests").doc(requestId).get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const files = snapshot.data()?.files;
    const file = Array.isArray(files) ? files.find((item) => item?.id === fileId) : null;
    const storagePath = typeof file?.storagePath === "string" ? file.storagePath : getStoragePathFromFileUrl(file?.url);
    if (!storagePath) {
      return NextResponse.json({ message: "No Storage path was saved for this file." }, { status: 404 });
    }

    const storageFile = bucket.file(storagePath);
    const [exists] = await storageFile.exists();
    if (!exists) {
      return NextResponse.json({ message: "Uploaded file was not found in Storage." }, { status: 404 });
    }

    const [url] = await storageFile.getSignedUrl({
      action: "read",
      expires: Date.now() + 10 * 60 * 1000
    });

    return NextResponse.json({ url });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not open uploaded file." },
      { status: 500 }
    );
  }
}

function getStoragePathFromFileUrl(url: string | undefined) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/o\/(.+)$/);
    return match ? decodeURIComponent(match[1]) : "";
  } catch {
    return "";
  }
}
