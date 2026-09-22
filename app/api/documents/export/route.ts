import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { demoRequest } from "@/lib/content";
import { renderDocxBuffer, renderDocumentHtml, renderRtf } from "@/lib/document-engine";

export async function POST(req: Request) {
  const { format = "pdf", request = demoRequest } = (await req.json()) as {
    format?: "html" | "pdf" | "docx" | "rtf" | "google-doc" | "google-html-debug";
    request?: typeof demoRequest;
  };

  if (format === "docx") {
    const buffer = await renderDocxBuffer(request);
    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${request.id || "qdro"}.docx"`
      }
    });
  }

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
      const doc = await createGoogleDocument(request);
      return NextResponse.json({
        message: "Google Doc created.",
        requestId: request.id,
        ...doc
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Docs export failed.";
      return NextResponse.json(
        {
          message,
          requestId: request.id
        },
        { status: message.includes("Google Drive is not connected") ? 401 : 501 }
      );
    }
  }

  if (format === "google-html-debug") {
    const html = renderDocumentHtml(request, false, { includeTemplateLabel: false });
    return new Response(googleDocHtmlShell(html), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${request.id || "qdro"}-google-export-debug.html"`
      }
    });
  }

  return new Response(renderDocumentHtml(request), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}

async function createGoogleDocument(request: typeof demoRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("google_refresh_token")?.value;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!refreshToken) {
    throw new Error(
      "Google Drive is not connected. Click Connect Google Drive, complete the Google sign-in, then try creating the Google Doc again."
    );
  }

  const accessToken = await getGoogleAccessToken(refreshToken);
  const html = renderDocumentHtml(request, false, { includeTemplateLabel: false });
  const boundary = `utahqdro-${Date.now()}`;
  const metadata = {
    name: `${request.id || "QDRO"} - ${request.clientName || "Client"} Draft`,
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
    googleDocHtmlShell(html),
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
    const detail = await response.text();
    throw new Error(`Google authentication failed: ${detail}`);
  }

  const token = (await response.json()) as { access_token?: string };
  if (!token.access_token) {
    throw new Error("Google authentication did not return an access token.");
  }
  return token.access_token;
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
