import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { QdroRequest, RequestFile } from "@/lib/types";

export const runtime = "nodejs";

type ExternalAccessLevel = "redacted" | "owner";

const defaultAllowedFields = [
  "plan_family",
  "entity_name",
  "financial_entity_name",
  "account_type",
  "tsp_account_type",
  "has_employer",
  "formal_plan_name",
  "division_type",
  "market_adjustment",
  "intake_source",
  "ai_assisted"
];

const blockedFieldPatterns = [
  /(^|_)ssn$/i,
  /(^|_)dob$/i,
  /birth/i,
  /signature/i,
  /email/i,
  /phone/i,
  /address/i,
  /(^|_)name$/i,
  /case_number/i,
  /judge/i,
  /marriage_date/i,
  /divorce_date/i,
  /award/i,
  /total/i
];

const ownerBlockedFieldPatterns = [
  /(^|_)ssn$/i,
  /(^|_)dob$/i,
  /birth/i
];

export async function GET(req: Request) {
  const authResult = authorizeExternalRequest(req);
  if (!authResult.ok) return authResult.response;

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const requestId = sanitizeRequestId(searchParams.get("requestId") || "");
  const limit = sanitizeLimit(searchParams.get("limit"));

  try {
    if (requestId) {
      const snapshot = await db.collection("requests").doc(requestId).get();
      if (!snapshot.exists) {
        return NextResponse.json({ message: "Request not found." }, { status: 404 });
      }

      return NextResponse.json({
        request: toExternalRequest(snapshot.id, snapshot.data() || {}, authResult.accessLevel)
      });
    }

    const snapshot = await db.collection("requests").orderBy("updatedAt", "desc").limit(limit).get();
    return NextResponse.json({
      requests: snapshot.docs.map((doc) => toExternalRequest(doc.id, doc.data(), authResult.accessLevel))
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load external request data." },
      { status: 500 }
    );
  }
}

function authorizeExternalRequest(req: Request) {
  const redactedToken = process.env.EXTERNAL_QDRO_API_TOKEN || "";
  const ownerToken = process.env.EXTERNAL_QDRO_OWNER_API_TOKEN || "";
  if (!redactedToken && !ownerToken) {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "External API access is not configured." }, { status: 503 })
    };
  }

  const header = req.headers.get("authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();

  if (token && ownerToken && secureEqual(token, ownerToken)) {
    return { ok: true as const, accessLevel: "owner" as const };
  }

  if (token && redactedToken && secureEqual(token, redactedToken)) {
    return { ok: true as const, accessLevel: "redacted" as const };
  }

  return {
    ok: false as const,
    response: NextResponse.json({ message: "External API token is invalid." }, { status: 401 })
  };
}

function secureEqual(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return valueBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function sanitizeRequestId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 100);
}

function sanitizeLimit(value: string | null) {
  const parsed = Number(value || 25);
  if (!Number.isFinite(parsed)) return 25;
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
}

function toExternalRequest(id: string, data: FirebaseFirestore.DocumentData, accessLevel: ExternalAccessLevel) {
  const request = normalizeRequest(id, data);
  if (accessLevel === "owner") return toOwnerExternalRequest(request);

  return {
    id: request.id,
    status: request.status,
    paymentState: request.paymentState,
    signatureState: request.signatureState,
    templateFamily: request.templateFamily,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    fields: filterExternalFields(request.fields),
    files: summarizeFiles(request.files),
    notes: summarizeNotes(request.notes)
  };
}

function toOwnerExternalRequest(request: QdroRequest) {
  return {
    id: request.id,
    ownerUid: request.ownerUid,
    clientName: request.clientName,
    clientEmail: request.clientEmail,
    status: request.status,
    paymentState: request.paymentState,
    signatureState: request.signatureState,
    templateFamily: request.templateFamily,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    fields: filterOwnerFields(request.fields),
    files: request.files,
    notes: request.notes
  };
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
    templateFamily: String(data.templateFamily || data.fields?.plan_family || ""),
    fields: data.fields && typeof data.fields === "object" ? data.fields : {},
    files: Array.isArray(data.files) ? data.files : [],
    notes: Array.isArray(data.notes) ? data.notes : [],
    createdAt: String(data.createdAt || ""),
    updatedAt: String(data.updatedAt || "")
  };
}

function filterExternalFields(fields: QdroRequest["fields"]) {
  const allowedFields = getAllowedFields();
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([key]) => allowedFields.has(key))
      .filter(([key]) => !isBlockedField(key))
      .map(([key, value]) => [key, typeof value === "boolean" ? value : String(value || "")])
  );
}

function getAllowedFields() {
  const configuredFields = (process.env.EXTERNAL_QDRO_ALLOWED_FIELDS || "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  return new Set(configuredFields.length ? configuredFields : defaultAllowedFields);
}

function isBlockedField(field: string) {
  return blockedFieldPatterns.some((pattern) => pattern.test(field));
}

function filterOwnerFields(fields: QdroRequest["fields"]) {
  return Object.fromEntries(
    Object.entries(fields).filter(([key]) => !ownerBlockedFieldPatterns.some((pattern) => pattern.test(key)))
  );
}

function summarizeFiles(files: RequestFile[]) {
  const countsByKind = files.reduce<Record<string, number>>((counts, file) => {
    const kind = file.kind || "other";
    counts[kind] = (counts[kind] || 0) + 1;
    return counts;
  }, {});

  return {
    total: files.length,
    countsByKind
  };
}

function summarizeNotes(notes: QdroRequest["notes"]) {
  return {
    total: notes.length,
    clientVisible: notes.filter((note) => note.visibility === "client").length,
    internal: notes.filter((note) => note.visibility === "internal").length
  };
}
