import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getAdminStorageBucket } from "@/lib/firebase-admin";
import type { QdroRequest, RequestFile } from "@/lib/types";

export const runtime = "nodejs";

const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png"
]);

const uploadLabels = {
  certified_qdro: "Certified QDRO",
  approval_letter: "Approval Letter or Proof of Division",
  appearance_of_counsel: "Appearance of Counsel",
  withdrawal_of_counsel: "Withdrawal of Counsel"
} as const;

type UploadType = keyof typeof uploadLabels;

export async function POST(req: Request) {
  try {
    const authResult = await requireAdminRequest(req, "Firebase Admin Storage is not configured.");
    if (!authResult.ok) return authResult.response;

    const bucket = getAdminStorageBucket();
    if (!bucket) {
      return NextResponse.json({ message: "Firebase Admin Storage is not configured." }, { status: 503 });
    }

    const formData = await req.formData();
    const requestId = sanitizeSegment(String(formData.get("requestId") || ""));
    const uploadType = normalizeUploadType(String(formData.get("uploadType") || ""));
    const files = formData.getAll("files").filter((file): file is File => file instanceof File);

    if (!requestId || !uploadType || !files.length) {
      return NextResponse.json({ message: "requestId, uploadType, and files are required." }, { status: 400 });
    }

    const requestRef = authResult.db.collection("requests").doc(requestId);
    const snapshot = await requestRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request not found." }, { status: 404 });
    }

    const existingFiles = Array.isArray(snapshot.data()?.files) ? (snapshot.data()?.files as RequestFile[]) : [];
    const uploadedFiles: RequestFile[] = [];

    for (const file of files) {
      const contentType = getUploadContentType(file);
      if (!allowedTypes.has(contentType)) {
        return NextResponse.json({ message: `${file.name} is not a supported document type.` }, { status: 400 });
      }

      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ message: `${file.name} is larger than the 20 MB upload limit.` }, { status: 400 });
      }

      const id = `admin-${uploadType}-${randomUUID()}`;
      const safeName = sanitizeFileName(file.name);
      const storagePath = `admin/requests/${requestId}/${id}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await bucket.file(storagePath).save(buffer, {
        contentType,
        resumable: false,
        metadata: {
          metadata: {
            uploadedBy: authResult.uid,
            requestId,
            uploadType
          }
        }
      });

      uploadedFiles.push({
        id,
        label: uploadLabels[uploadType],
        kind: uploadType === "certified_qdro" ? "signed" : "other",
        fileName: file.name,
        status: uploadType === "certified_qdro" ? "signed" : "uploaded",
        storagePath
      });
    }

    await requestRef.update({
      files: [...existingFiles, ...uploadedFiles],
      updatedAt: new Date().toISOString()
    });

    const updatedSnapshot = await requestRef.get();

    return NextResponse.json({
      message: "File uploaded.",
      request: normalizeRequest(updatedSnapshot.id, updatedSnapshot.data() || {})
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not upload file." },
      { status: 500 }
    );
  }
}

function normalizeUploadType(value: string): UploadType | "" {
  return value === "certified_qdro" ||
    value === "approval_letter" ||
    value === "appearance_of_counsel" ||
    value === "withdrawal_of_counsel"
    ? value
    : "";
}

function normalizeRequest(id: string, data: FirebaseFirestore.DocumentData): QdroRequest {
  return {
    id,
    ownerUid: String(data.ownerUid || ""),
    clientName: String(data.clientName || ""),
    clientEmail: String(data.clientEmail || ""),
    status: data.status,
    paymentState: data.paymentState,
    signatureState: data.signatureState,
    templateFamily: String(data.templateFamily || ""),
    fields: data.fields && typeof data.fields === "object" ? data.fields : {},
    files: Array.isArray(data.files) ? data.files : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || new Date().toISOString())
  };
}

function sanitizeSegment(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 100);
}

function sanitizeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 140);
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
