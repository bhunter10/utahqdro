import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getAdminStorageBucket } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdminRequest(req, "Firebase Admin Storage is not configured.");
    if (!authResult.ok) return authResult.response;

    const bucket = getAdminStorageBucket();
    if (!bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId") || "";
    const fileId = searchParams.get("fileId") || "";
    if (!requestId || !fileId) {
      return NextResponse.json({ message: "requestId and fileId are required." }, { status: 400 });
    }

    const snapshot = await authResult.db.collection("requests").doc(requestId).get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const files = snapshot.data()?.files;
    const file = Array.isArray(files) ? files.find((item) => item?.id === fileId) : null;
    const storagePath = typeof file?.storagePath === "string" ? file.storagePath : getStoragePathFromFileUrl(file?.url);
    if (!storagePath) {
      const fallbackUrl = typeof file?.url === "string" ? file.url : "";
      if (fallbackUrl) {
        if (isWordPressUrl(fallbackUrl)) {
          return NextResponse.json(
            { message: "This old WordPress file has not been migrated to Firebase Storage yet." },
            { status: 404 }
          );
        }

        return NextResponse.json({ url: fallbackUrl });
      }

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

function isWordPressUrl(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "utahqdro.com" || host.endsWith(".utahqdro.com");
  } catch {
    return false;
  }
}
