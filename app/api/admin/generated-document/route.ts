import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { documentTemplates } from "@/lib/content";
import { getAdminStorageBucket } from "@/lib/firebase-admin";
import { generateDocumentFile, generatedDocumentLabels, renderGeneratedDocumentHtml } from "@/lib/generated-documents";
import type { GeneratedDocumentType } from "@/lib/generated-documents";
import type { DocumentTemplate, QdroRequest, RequestFile } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return auth.response;
    const bucket = getAdminStorageBucket();
    if (!bucket) return NextResponse.json({ message: "Firebase Storage is not configured." }, { status: 503 });

    const body = await req.json();
    const { requestId, documentType, format, fields, templateFamily } = body;
    if (typeof requestId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(requestId) ||
        !Object.hasOwn(generatedDocumentLabels, documentType) ||
        (format !== "pdf" && format !== "rtf") ||
        !fields || typeof fields !== "object" || Array.isArray(fields) ||
        Object.values(fields).some((value) => typeof value !== "string" && typeof value !== "boolean")) {
      return NextResponse.json({ message: "A request, document type, PDF/RTF format, and preview fields are required." }, { status: 400 });
    }

    const ref = auth.db.collection("requests").doc(requestId);
    const [snapshot, templateSnapshot] = await Promise.all([
      ref.get(), auth.db.collection("documentTemplates").get()
    ]);
    if (!snapshot.exists) return NextResponse.json({ message: "Request not found." }, { status: 404 });
    const request = { ...snapshot.data(), id: snapshot.id, fields,
      templateFamily: typeof templateFamily === "string" ? templateFamily : snapshot.data()?.templateFamily
    } as QdroRequest;
    const templatesById = new Map(documentTemplates.map((template) => [template.id, template]));
    templateSnapshot.docs.forEach((doc) => templatesById.set(doc.id, { ...doc.data(), id: doc.id } as DocumentTemplate));
    const html = renderGeneratedDocumentHtml(request, documentType as GeneratedDocumentType, [...templatesById.values()]);
    const buffer = await generateDocumentFile(html, format);
    const id = `admin-generated-${randomUUID()}`;
    const label = generatedDocumentLabels[documentType as GeneratedDocumentType];
    const fileName = `${requestId}-${label.replace(/\s+/g, "-")}.${format}`;
    const storagePath = `admin/requests/${requestId}/${id}-${fileName}`;
    const file: RequestFile = { id, label, kind: "generated", status: "generated", fileName, storagePath };
    await bucket.file(storagePath).save(buffer, {
      resumable: false,
      contentType: format === "pdf" ? "application/pdf" : "application/rtf",
      metadata: { contentDisposition: `attachment; filename="${fileName}"`,
        metadata: { generatedBy: auth.uid, requestId, documentType } }
    });
    try {
      await ref.update({ files: FieldValue.arrayUnion(file), updatedAt: new Date().toISOString() });
    } catch (error) {
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
      throw error;
    }
    return NextResponse.json({ message: `${label} attached as ${format.toUpperCase()}.`, file });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : "Could not attach document." }, { status: 500 });
  }
}
