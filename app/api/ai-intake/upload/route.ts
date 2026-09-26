import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminStorageBucket } from "@/lib/firebase-admin";
import type { AiUploadedFile } from "@/lib/ai-intake";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
]);

export async function POST(req: Request) {
  try {
    const auth = getAdminAuth();
    const bucket = getAdminStorageBucket();
    if (!auth || !bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ message: "Sign in before uploading documents." }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    const formData = await req.formData();
    const requestId = sanitizeSegment(String(formData.get("requestId") || ""));
    const kind = normalizeKind(String(formData.get("kind") || "other"));
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!requestId || !files.length) {
      return NextResponse.json({ message: "requestId and files are required." }, { status: 400 });
    }

    const uploaded: AiUploadedFile[] = [];

    for (const file of files) {
      const contentType = getUploadContentType(file);
      if (!allowedTypes.has(contentType)) {
        return NextResponse.json({ message: `${file.name} is not a supported document type.` }, { status: 400 });
      }

      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ message: `${file.name} is larger than the 20 MB upload limit.` }, { status: 400 });
      }

      const id = `${kind}-${randomUUID()}`;
      const safeName = sanitizeFileName(file.name);
      const storagePath = `users/${decoded.uid}/requests/${requestId}/${id}-${safeName}`;
      const downloadToken = randomUUID();
      const buffer = Buffer.from(await file.arrayBuffer());
      const storageFile = bucket.file(storagePath);

      await storageFile.save(buffer, {
        contentType,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
            ownerUid: decoded.uid,
            requestId,
            kind
          }
        }
      });

      uploaded.push({
        id,
        name: file.name,
        type: contentType,
        size: file.size,
        url: getDownloadUrl(bucket.name, storagePath, downloadToken),
        storagePath,
        kind
      });
    }

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not upload documents." },
      { status: 500 }
    );
  }
}

function normalizeKind(value: string): AiUploadedFile["kind"] {
  return value === "decree" || value === "statement" ? value : "other";
}

function sanitizeSegment(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 120);
}

function getUploadContentType(file: File) {
  if (file.type) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "application/pdf";
  if (extension === "doc") return "application/msword";
  if (extension === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  return "application/octet-stream";
}

function getDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}
