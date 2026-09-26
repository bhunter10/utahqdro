import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { findUtahCourt } from "@/lib/utah-courts";
import type { QdroRequest, RequestFile, RequestNote } from "@/lib/types";
import { getRequesterIdentity, type AiExtractedField, type AiUploadedFile } from "@/lib/ai-intake";

export const runtime = "nodejs";

type SubmitRequest = {
  requestId?: string;
  fields?: Record<string, string | boolean>;
  files?: AiUploadedFile[];
  extraction?: {
    summary?: string;
    fields?: AiExtractedField[];
  };
  missingFieldLabels?: string[];
};

export async function POST(req: Request) {
  try {
    const auth = getAdminAuth();
    const db = getAdminDb();
    if (!auth || !db) {
      return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
    }

    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ message: "Sign in before submitting the request." }, { status: 401 });
    }

    const decoded = await auth.verifyIdToken(token);
    const body = (await req.json()) as SubmitRequest;
    const requestId = sanitizeRequestId(body.requestId || `QDRO-AI-${Date.now()}`);
    const submittedFields = body.fields || {};
    const court = typeof submittedFields.court_location === "string" ? findUtahCourt(submittedFields.court_location) : null;
    const fields: Record<string, string | boolean> = {
      ...submittedFields,
      ai_assisted: "Yes",
      intake_source: "/qdro-request-ai",
      court_county: court?.county || String(submittedFields.court_county || ""),
      district: court?.district || String(submittedFields.district || "")
    };
    const now = new Date().toISOString();
    const requester = getRequesterIdentity(fields, decoded.email || "");
    const clientName = requester.name;
    const clientEmail = requester.email;
    const extractionFields = body.extraction?.fields || [];

    const request: QdroRequest = {
      id: requestId,
      ownerUid: decoded.uid,
      clientName,
      clientEmail,
      status: "Submitted",
      paymentState: "unpaid",
      signatureState: "not_started",
      templateFamily: String(fields.plan_family || "Multi-template / other"),
      fields,
      files: toRequestFiles(body.files || []),
      notes: [
        {
          id: `ai-note-${Date.now()}`,
          author: "AI intake",
          visibility: "internal",
          body: buildInternalNote(body.extraction?.summary || "", extractionFields, body.missingFieldLabels || []),
          createdAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    await db.collection("requests").doc(requestId).set(toFirestoreRequest(request));

    return NextResponse.json({
      message: "Request submitted to admin review.",
      request
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not submit the request." },
      { status: 500 }
    );
  }
}

function sanitizeRequestId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 80);
}

function toRequestFiles(files: AiUploadedFile[]): RequestFile[] {
  return files.map((file, index) => ({
    id: file.id || `file-${index + 1}`,
    label: file.kind === "decree" ? "Signed divorce decree" : file.kind === "statement" ? "Retirement account statement" : "Additional document",
    kind: file.kind === "decree" || file.kind === "statement" ? file.kind : "other",
    fileName: file.name,
    status: "uploaded",
    url: file.url,
    storagePath: file.storagePath
  }));
}

function buildInternalNote(summary: string, fields: AiExtractedField[], missingFieldLabels: string[]) {
  const lines = [
    "Submitted through /qdro-request-ai.",
    summary ? `AI summary: ${summary}` : "AI summary: No summary returned.",
    missingFieldLabels.length
      ? `Client submitted without these fields: ${missingFieldLabels.join(", ")}.`
      : "Client completed or confirmed all currently required fields.",
    "",
    "AI field review:"
  ];

  if (!fields.length) {
    lines.push("No fields were extracted automatically.");
  } else {
    for (const field of fields) {
      lines.push(`- ${field.id}: ${field.confidence}; source: ${field.source || "not stated"}; note: ${field.note || "none"}`);
    }
  }

  return lines.join("\n");
}

function toFirestoreRequest(request: QdroRequest) {
  return Object.fromEntries(Object.entries(request).filter(([, value]) => value !== undefined));
}
