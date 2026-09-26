import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-access";
import { getAdminAuth, getAdminDb, getAdminStorageBucket } from "@/lib/firebase-admin";
import type { QdroRequest, RequestStatus } from "@/lib/types";

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
      return NextResponse.json({ message: "Request not found.", requests: [] }, { status: 404 });
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

    return NextResponse.json({ message: "Request and uploaded files deleted.", requests: [] });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Could not delete request.", requests: [] },
      { status: 500 }
    );
  }
}

async function requireAdmin(req: Request): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse<{ message: string; requests?: QdroRequest[] }> }
> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Firebase Admin is not configured.", requests: [] }, { status: 503 })
    };
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Admin sign-in is required.", requests: [] }, { status: 401 })
    };
  }

  const decoded = await auth.verifyIdToken(token);
  if (await isAdminUser(decoded, db)) return { ok: true, uid: decoded.uid };

  return {
    ok: false,
    response: NextResponse.json({ message: "Admin access is required.", requests: [] }, { status: 403 })
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
    signatureState:
      data.signatureState === "sent" || data.signatureState === "partially_signed" || data.signatureState === "completed"
        ? data.signatureState
        : "not_started",
    templateFamily: String(data.templateFamily || data.fields?.plan_family || "Multi-template / other"),
    fields: normalizeFields(data.fields),
    files: normalizeFiles(data.files),
    notes: Array.isArray(data.notes) ? data.notes : [],
    createdAt: String(data.createdAt || new Date().toISOString()),
    updatedAt: String(data.updatedAt || data.createdAt || new Date().toISOString())
  };
}

function normalizeStatus(status: unknown): RequestStatus {
  const validStatuses: RequestStatus[] = [
    "Draft",
    "Submitted",
    "Payment Pending",
    "Paid",
    "In Review",
    "Needs Client Info",
    "Draft Prepared",
    "Sent for Signature",
    "Filed with Court",
    "Sent to Plan Administrator",
    "Completed",
    "Cancelled"
  ];

  return validStatuses.includes(status as RequestStatus) ? (status as RequestStatus) : "Submitted";
}

function normalizeFields(fields: unknown) {
  if (!fields || typeof fields !== "object") return {};
  return fields as Record<string, string | boolean>;
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
