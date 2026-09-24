"use client";

import { useMemo, useState } from "react";
import { renderDocumentHtml } from "@/lib/document-engine";
import type { DocumentTemplate, QdroRequest } from "@/lib/types";

export function DocumentPreview({
  request,
  templates
}: {
  request: QdroRequest;
  templates?: DocumentTemplate[];
}) {
  const [googleDocStatus, setGoogleDocStatus] = useState("");
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [needsGoogleConnection, setNeedsGoogleConnection] = useState(false);
  const [isCreatingGoogleDoc, setIsCreatingGoogleDoc] = useState(false);
  const html = useMemo(() => renderDocumentHtml(request, false, { includeTemplateLabel: false, templates }), [request, templates]);

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
          {needsGoogleConnection && (
            <a className="button secondary" href="/api/google/oauth/start" target="_blank">
              Connect Google Drive
            </a>
          )}
          <button className="button secondary" type="button" onClick={createGoogleDoc} disabled={isCreatingGoogleDoc}>
            {isCreatingGoogleDoc ? "Generating..." : "Generate Google Doc"}
          </button>
        </div>
      </div>
      <div className="preview-document" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
