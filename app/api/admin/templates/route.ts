import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/admin-api";
import { documentTemplates } from "@/lib/content";
import { getAdminDb } from "@/lib/firebase-admin";
import type { DocumentTemplate } from "@/lib/types";

const collectionName = "documentTemplates";

export async function GET(req: Request) {
  try {
    const authResult = await requireAdmin(req);
    if (!authResult.ok) return authResult.response;

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        {
          message: "Firebase Admin is not configured.",
          templates: []
        },
        { status: 503 }
      );
    }

    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
      return NextResponse.json({
        message: "No templates are saved in Firestore yet.",
        templates: documentTemplates
      });
    }

    const savedTemplates = snapshot.docs.map((doc) => normalizeTemplate(doc.id, doc.data()));

    return NextResponse.json({
      templates: mergeDefaultTemplates(savedTemplates)
        .sort((first, second) => first.family.localeCompare(second.family) || first.version - second.version)
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Could not load database templates.") },
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
      return NextResponse.json(
        { message: "Firebase Admin is not configured. Template changes cannot be saved." },
        { status: 503 }
      );
    }

    const body = (await req.json()) as { templateId?: string; htmlBody?: string };
    if (!body.templateId || typeof body.htmlBody !== "string") {
      return NextResponse.json({ message: "templateId and htmlBody are required." }, { status: 400 });
    }

    const templateRef = db.collection(collectionName).doc(body.templateId);
    const existing = await templateRef.get();
    const existingTemplate = existing.exists
      ? normalizeTemplate(existing.id, existing.data() || {})
      : documentTemplates.find((template) => template.id === body.templateId) || null;

    if (!existingTemplate) {
      return NextResponse.json({ message: "Template not found." }, { status: 404 });
    }

    const savedTemplate: DocumentTemplate & { updatedAt: string; updatedBy: string } = {
      ...existingTemplate,
      format: "html",
      htmlBody: body.htmlBody,
      updatedAt: new Date().toISOString(),
      updatedBy: authResult.uid
    };

    await templateRef.set(toFirestoreTemplate(savedTemplate), { merge: true });

    return NextResponse.json({
      message: "Template changes saved.",
      template: savedTemplate
    });
  } catch (error) {
    return NextResponse.json(
      { message: getErrorMessage(error, "Could not save template changes.") },
      { status: 500 }
    );
  }
}

async function requireAdmin(req: Request): Promise<
  | { ok: true; uid: string }
  | { ok: false; response: NextResponse<{ message: string }> }
> {
  const authResult = await requireAdminRequest(req);
  return authResult.ok ? { ok: true, uid: authResult.uid } : authResult;
}

function normalizeTemplate(id: string, data: FirebaseFirestore.DocumentData): DocumentTemplate {
  return {
    id,
    name: String(data.name || ""),
    family: String(data.family || ""),
    planFamilies: Array.isArray(data.planFamilies) ? data.planFamilies.filter((family) => typeof family === "string") : undefined,
    accountTypes: Array.isArray(data.accountTypes) ? data.accountTypes.filter((accountType) => typeof accountType === "string") : undefined,
    version: Number(data.version || 1),
    description: String(data.description || ""),
    format: data.format === "html" || data.format === "plain" ? data.format : undefined,
    body: typeof data.body === "string" ? data.body : undefined,
    htmlBody: typeof data.htmlBody === "string" ? data.htmlBody : undefined,
    mergeFields: Array.isArray(data.mergeFields) ? data.mergeFields.filter((field) => typeof field === "string") : undefined,
    active: Boolean(data.active)
  };
}

function mergeDefaultTemplates(savedTemplates: DocumentTemplate[]) {
  const templatesById = new Map(documentTemplates.map((template) => [template.id, template]));
  savedTemplates.forEach((template) => templatesById.set(template.id, template));
  return Array.from(templatesById.values());
}

function toFirestoreTemplate(template: DocumentTemplate & { updatedAt: string; updatedBy: string }) {
  return Object.fromEntries(
    Object.entries(template).filter(([, value]) => value !== undefined)
  );
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
