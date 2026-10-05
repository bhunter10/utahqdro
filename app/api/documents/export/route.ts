import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { demoRequest, documentTemplates } from "@/lib/content";
import {
  renderAddendumHtml,
  renderAppearanceOfCounselHtml,
  renderDocumentHtml,
  renderDocumentPackageHtml,
  renderRtf,
  renderWithdrawalOfCounselHtml
} from "@/lib/document-engine";
import { getAdminDb } from "@/lib/firebase-admin";
import type { DocumentTemplate } from "@/lib/types";

type ExportDocumentType = "qdro" | "appearance" | "withdrawal" | "addendum" | "package";

export async function POST(req: Request) {
  const { documentType = "package", format = "pdf", request = demoRequest } = (await req.json()) as {
    documentType?: ExportDocumentType;
    format?: "html" | "pdf" | "rtf" | "google-doc";
    request?: typeof demoRequest;
  };

  if (format === "rtf") {
    return new Response(renderRtf(request), {
      headers: {
        "Content-Type": "application/rtf",
        "Content-Disposition": `attachment; filename="${request.id || "qdro"}.rtf"`
      }
    });
  }

  if (format === "google-doc") {
    try {
      const doc = await createGoogleDocument(request, documentType);
      return NextResponse.json({
        message: "Google Doc created.",
        requestId: request.id,
        ...doc
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Docs export failed.";
      const needsGoogleConnection = error instanceof GoogleConnectionError || message.includes("Google Drive is not connected");
      const response = NextResponse.json(
        {
          message,
          requestId: request.id
        },
        { status: needsGoogleConnection ? 401 : 501 }
      );
      if (needsGoogleConnection) {
        response.cookies.delete("google_refresh_token");
      }
      return response;
    }
  }

  const templates = await loadDatabaseTemplates();
  return new Response(renderDocumentPackageHtml(request, false, { templates }), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function createGoogleDocument(request: typeof demoRequest, documentType: ExportDocumentType) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!refreshToken) {
    throw new Error(
      "Google Drive is not connected. Click Connect Google Drive, complete the Google sign-in, then try creating the Google Doc again."
    );
  }

  const accessToken = await getGoogleAccessToken(refreshToken);
  const templates = await loadDatabaseTemplates();
  const html = renderGoogleDocumentHtml(request, documentType, templates);
  const boundary = `utahqdro-${Date.now()}`;
  const metadata = {
    name: getGoogleDocumentTitle(request, documentType),
    mimeType: "application/vnd.google-apps.document",
    ...(folderId ? { parents: [folderId] } : {})
  };
  const body = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    googleDocHtmlShell(html.trim()),
    `--${boundary}--`
  ].join("\r\n");

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`
    },
    body
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Docs export failed: ${detail}`);
  }

  return response.json() as Promise<{ id: string; name: string; webViewLink: string }>;
}

function renderGoogleDocumentHtml(request: typeof demoRequest, documentType: ExportDocumentType, templates: DocumentTemplate[]) {
  const options = { includeTemplateLabel: false, templates, wrapDocument: false, wrapBody: false };
  if (documentType === "appearance") {
    return renderAppearanceOfCounselHtml(request, false, options);
  }
  if (documentType === "withdrawal") {
    return renderWithdrawalOfCounselHtml(request, false, options);
  }
  if (documentType === "addendum") {
    return renderAddendumHtml(request, false, options);
  }
  if (documentType === "qdro") {
    return renderDocumentHtml(request, false, options);
  }
  return renderDocumentPackageHtml(request, false, options);
}

function getDocumentName(documentType: ExportDocumentType) {
  if (documentType === "appearance") return "Appearance of Counsel";
  if (documentType === "withdrawal") return "Withdrawal of Counsel";
  if (documentType === "addendum") return "Addendum";
  if (documentType === "qdro") return "QDRO Draft";
  return "Document Package";
}

function getGoogleDocumentTitle(request: typeof demoRequest, documentType: ExportDocumentType) {
  const planFamily = formatTitleSegment(String(request.fields.plan_family || request.templateFamily || "Plan"));
  const documentName = formatTitleSegment(getExportTitleDocumentSegment(documentType));
  const accountType = formatTitleSegment(getExportTitleAccountType(String(request.fields.account_type || "")));
  const lastName = formatTitleSegment(getClientLastName(String(request.clientName || request.fields.party1_name || "Client")));

  return ["QDRO", planFamily, documentName, accountType, lastName].filter(Boolean).join("_");
}

function getExportTitleDocumentSegment(documentType: ExportDocumentType) {
  if (documentType === "addendum") return "Addendum";
  if (documentType === "appearance") return "Appearance";
  if (documentType === "withdrawal") return "Withdrawal";
  if (documentType === "package") return "Package";
  return "";
}

function getExportTitleAccountType(accountType: string) {
  const accountTypeNames: Record<string, string> = {
    "401k plan": "401k",
    "403b plan": "403b",
    "457 plan": "457"
  };

  return accountTypeNames[accountType] || accountType;
}

function getClientLastName(clientName: string) {
  const parts = clientName.trim().split(/\s+/).filter(Boolean);
  return parts.at(-1) || "Client";
}

function formatTitleSegment(value: string) {
  return value
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

async function loadDatabaseTemplates() {
  const db = getAdminDb();
  if (!db) return documentTemplates;

  const snapshot = await db.collection("documentTemplates").where("active", "==", true).get();
  if (snapshot.empty) return documentTemplates;

  const savedTemplates = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
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
    } satisfies DocumentTemplate;
  });

  return mergeDefaultTemplates(savedTemplates).filter((template) => template.active);
}

function mergeDefaultTemplates(savedTemplates: DocumentTemplate[]) {
  const templatesById = new Map(documentTemplates.map((template) => [template.id, template]));
  savedTemplates.forEach((template) => templatesById.set(template.id, template));
  return Array.from(templatesById.values());
}

async function getGoogleAccessToken(refreshToken: string) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth needs GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  if (!response.ok) {
    const detail = await readGoogleTokenError(response);
    if (detail.error === "invalid_grant") {
      throw new GoogleConnectionError(
        "Google Drive needs to be reconnected. Click Connect Google Drive, complete the Google sign-in, then create the Google Doc again."
      );
    }
    throw new Error(`Google authentication failed: ${detail.description}`);
  }

  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error("Google authentication did not return an access token.");
  }
  return token.access_token;
}

class GoogleConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleConnectionError";
  }
}

async function readGoogleTokenError(response: Response) {
  const fallback = await response.text();
  try {
    const parsed = JSON.parse(fallback) as { error?: string; error_description?: string };
    return {
      error: parsed.error || "",
      description: parsed.error_description || fallback
    };
  } catch {
    return {
      error: "",
      description: fallback
    };
  }
}

function googleDocHtmlShell(documentHtml: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { margin: 0; }
    </style>
  </head>
  <body style="margin: 0; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">${documentHtml}</body>
</html>`;
}
