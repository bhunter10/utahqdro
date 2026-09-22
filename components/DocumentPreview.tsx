"use client";

import { useMemo, useState } from "react";
import { renderDocumentHtml } from "@/lib/document-engine";
import type { QdroRequest } from "@/lib/types";

export function DocumentPreview({ request }: { request: QdroRequest }) {
  const [googleDocStatus, setGoogleDocStatus] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [needsGoogleConnection, setNeedsGoogleConnection] = useState(false);
  const [isCreatingGoogleDoc, setIsCreatingGoogleDoc] = useState(false);
  const html = useMemo(() => renderDocumentHtml(request), [request]);

  function printPreview() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const printableHtml = `
      <!doctype html>
      <html>
        <head>
          <title>${request.id} preview</title>
          <style>
            body { margin: 0; padding: 0.75in; }
          </style>
        </head>
        <body>${html}</body>
      </html>`;
    printWindow.document.open();
    printWindow.document.write(printableHtml);
    printWindow.document.close();
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  }

  async function createGoogleDoc() {
    setIsCreatingGoogleDoc(true);
    setGoogleDocStatus("");
    setGoogleDocUrl("");
    setNeedsGoogleConnection(false);
    try {
      const response = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "google-doc", request })
      });
      const result = (await response.json()) as { message?: string; webViewLink?: string };
      if (!response.ok) {
        setGoogleDocStatus(result.message || "Google Docs export is not configured yet.");
        setNeedsGoogleConnection(response.status === 401 || result.message?.includes("Google Drive is not connected") || false);
        return;
      }
      setGoogleDocStatus(result.message || "Google Doc created.");
      setGoogleDocUrl(result.webViewLink || "");
    } catch {
      setGoogleDocStatus("Google Docs export failed. Check the server configuration and try again.");
    } finally {
      setIsCreatingGoogleDoc(false);
    }
  }

  async function downloadGoogleExportHtml() {
    const response = await fetch("/api/documents/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "google-html-debug", request })
    });
    if (!response.ok) {
      setGoogleDocStatus("Could not create the Google export debug HTML.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${request.id || "qdro"}-google-export-debug.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <span className="status info">Live preview</span>
          <h2 style={{ marginTop: 12 }}>Draft document preview</h2>
          <p>This preview uses the same field data as the export engine.</p>
          {googleDocStatus && (
            <p className="preview-action-status">
              {googleDocStatus} {googleDocUrl && <a className="muted-link" href={googleDocUrl} target="_blank">Open Google Doc</a>}
            </p>
          )}
        </div>
        <div className="preview-actions">
          <button className="button secondary" type="button" onClick={printPreview}>
            Print
          </button>
          <button className="button secondary" type="button" onClick={downloadGoogleExportHtml}>
            Download Google HTML
          </button>
          {needsGoogleConnection && (
            <a className="button secondary" href="/api/google/oauth/start" target="_blank">
              Connect Google Drive
            </a>
          )}
          <button className="button secondary" type="button" onClick={createGoogleDoc} disabled={isCreatingGoogleDoc}>
            {isCreatingGoogleDoc ? "Creating..." : "Create Google Doc"}
          </button>
        </div>
      </div>
      <div className="preview-document" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
