import { NextResponse } from "next/server";
import { demoRequest } from "@/lib/content";
import { renderDocxBuffer, renderDocumentHtml, renderRtf } from "@/lib/document-engine";

export async function POST(req: Request) {
  const { format = "pdf", request = demoRequest } = (await req.json()) as {
    format?: "html" | "pdf" | "docx" | "rtf" | "google-doc";
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
    return NextResponse.json({
      message:
        "Google Docs export is ready for service-account or OAuth wiring. Generate DOCX, upload to Drive, then convert to a Google Doc.",
      requestId: request.id
    });
  }

  return new Response(renderDocumentHtml(request), {
    headers: {
      "Content-Type": "text/html; charset=utf-8"
    }
  });
}
