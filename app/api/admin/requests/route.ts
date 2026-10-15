import { normalizePartyNames } from "@/lib/field-format";
import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { getRequesterIdentity } from "@/lib/ai-intake";
import { getAdminDb, getAdminStorageBucket } from "@/lib/firebase-admin";
import { requestStatuses, type QdroRequest, type RequestStatus } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (!authResult.ok) return authResult.response;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ message: "Firebase Admin is not configured.", requests: [] }, { status: 503 });
    }

    const snapshot = await db.collection("requests").orderBy("createdAt", "desc").limit(100).get();

    return NextResponse.json({
      requests: snapshot.docs.map((doc) => normalizeRequest(doc.id, doc.data()))
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not load requests." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (!authResult.ok) return authResult.response;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ message: "Firebase Admin is not configured.", requests: [] }, { status: 503 });
    }

    const { requestId } = (await req.json()) as { requestId?: string };
    if (!requestId) {
      return NextResponse.json({ message: "requestId is required.", requests: [] }, { status: 400 });
    }

    const requestRef = db.collection("requests").doc(requestId);
    const snapshot = await requestRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request deleted.", requests: [] });
    }

    const request = normalizeRequest(snapshot.id, snapshot.data() || {});
    const bucket = getAdminStorageBucket();
    if (bucket) {
      await Promise.all(
        request.files
          .map((file) => file.storagePath || getStoragePathFromFileUrl(file.url))
          .filter((path): path is string => Boolean(path))
          .map((path) => bucket.file(path).delete({ ignoreNotFound: true }))
      );
    }

    await requestRef.delete();

    return NextResponse.json({ message: "Request deleted.", requests: [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete request.", requests: [] },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (!authResult.ok) return authResult.response;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ message: "Firebase Admin is not configured.", requests: [] }, { status: 503 });
    }

    const body = (await req.json()) as {
      requestId?: string;
      fields?: QdroRequest["fields"];
      notes?: QdroRequest["notes"];
      status?: RequestStatus;
      templateFamily?: string;
    };
    if (!body.requestId) {
      return NextResponse.json({ message: "requestId is required.", requests: [] }, { status: 400 });
    }

    const requestRef = db.collection("requests").doc(body.requestId);
    const snapshot = await requestRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ message: "Request not found.", requests: [] }, { status: 404 });
    }

    const current = normalizeRequest(snapshot.id, snapshot.data() || {});
    const updatedAt = new Date().toISOString();
    const nextFields = normalizeFields(body.fields || current.fields);
    const requester = getRequesterIdentity(nextFields, current.clientEmail);
    const update: Partial<QdroRequest> = {
      clientName: requester.name || current.clientName,
      clientEmail: requester.email || current.clientEmail,
      fields: nextFields,
      notes: Array.isArray(body.notes) ? body.notes : current.notes,
      status: normalizeStatus(body.status || current.status),
      templateFamily: String(body.templateFamily || nextFields.plan_family || current.templateFamily),
      updatedAt
    };

    await requestRef.set(update, { merge: true });
    const updatedSnapshot = await requestRef.get();

    return NextResponse.json({
      message: "Request changes saved.",
      request: normalizeRequest(updatedSnapshot.id, updatedSnapshot.data() || {})
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not save request changes.", requests: [] },
      { status: 500 }
    );
  }
}

async function requireAdmin(req: Request): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse<{ message: string; requests?: QdroRequest[] }> }
> {
  const authResult = await requireAdminRequest(req, "Firebase Admin is not configured.");
  if (authResult.ok) return { ok: true, uid: authResult.uid };

  const body = await authResult.response.json();
  return {
    ok: false,
    response: NextResponse.json({ ...body, requests: [] }, { status: authResult.response.status })
  };
}

function normalizeRequest(id: string, data: FirebaseFirestore.DocumentData): QdroRequest {
  return {
    id,
    ownerUid: String(data.ownerUid || ""),
    clientName: String(data.clientName || "Unnamed client"),
    clientEmail: String(data.clientEmail || ""),
    status: normalizeStatus(data.status),
    paymentState: data.paymentState === "pending" || data.paymentState === "paid" || data.paymentState === "waived" ? data.paymentState : "unpaid",
    stripePaidAmountCents: typeof data.stripePaidAmountCents === "number" && Number.isSafeInteger(data.stripePaidAmountCents) && data.stripePaidAmountCents >= 0
      ? data.stripePaidAmountCents
      : undefined,
    signatureState:
      data.signatureState === "sent" || data.signatureState === "partially_signed" || data.signatureState === "completed"
        ? data.signatureState
        : "not_started",
    templateFamily: String(data.templateFamily || data.fields?.plan_family || "Other"),
    fields: normalizeFields(data.fields),
    files: normalizeFiles(data.files),
    notes: Array.isArray(data.notes) ? data.notes : [],
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || data.createdAt || new Date().toISOString())
  };
}

function normalizeStatus(status: unknown): RequestStatus {
  return requestStatuses.includes(status as RequestStatus) ? (status as RequestStatus) : "Pending";
}

function normalizeFields(fields: unknown) {
  if (!fields || typeof fields !== "object") return {};
  return normalizePartyNames(fields as Record<string, string | boolean>);
}

function normalizeFiles(files: unknown) {
  if (!Array.isArray(files)) return [];

  return files.map((file, index) => {
    const requestFile = file && typeof file === "object" ? (file as QdroRequest["files"][number]) : null;
    const url = typeof requestFile?.url === "string" ? requestFile.url : "";
    return {
      id: String(requestFile?.id || `file-${index + 1}`),
      label: String(requestFile?.label || "Uploaded document"),
      kind:
        requestFile?.kind === "decree" ||
        requestFile?.kind === "statement" ||
        requestFile?.kind === "generated" ||
        requestFile?.kind === "signed" ||
        requestFile?.kind === "other"
          ? requestFile.kind
          : "other",
      fileName: String(requestFile?.fileName || "Uploaded file"),
      status:
        requestFile?.status === "missing" ||
        requestFile?.status === "uploaded" ||
        requestFile?.status === "generated" ||
        requestFile?.status === "signed"
          ? requestFile.status
          : "uploaded",
      url,
      storagePath: typeof requestFile?.storagePath === "string" ? requestFile.storagePath : getStoragePathFromFileUrl(url)
    };
  });
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
