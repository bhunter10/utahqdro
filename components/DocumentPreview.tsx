"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getMissingPreviewDocumentFieldValues,
  renderAddendumHtml,
  renderAppearanceOfCounselHtml,
  renderDocumentHtml,
  renderWithdrawalOfCounselHtml
} from "@/lib/document-engine";
import type { DocumentTemplate, QdroRequest } from "@/lib/types";
import type { GeneratedDocumentFormat, GeneratedDocumentType } from "@/lib/generated-documents";

type PreviewDocumentType = "qdro" | "appearance" | "withdrawal" | "addendum";
type GoogleDocResult = {
  status: string;
  url: string;
};

export function DocumentPreview({
  request,
  templates,
  onAttachDocument
}: {
  request: QdroRequest;
  templates?: DocumentTemplate[];
  onAttachDocument?: (documentType: GeneratedDocumentType, format: GeneratedDocumentFormat) => Promise<string>;
}) {
  const [attachmentStatus, setAttachmentStatus] = useState("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [googleDocResults, setGoogleDocResults] = useState<Partial<Record<PreviewDocumentType, GoogleDocResult>>>({});
  const [needsGoogleConnection, setNeedsGoogleConnection] = useState(false);
  const [isCreatingGoogleDoc, setIsCreatingGoogleDoc] = useState(false);
  const [activeDocument, setActiveDocument] = useState<PreviewDocumentType>("qdro");
  const hasAddendum = hasAddendumDocument(request);
  const activeGoogleDoc = googleDocResults[activeDocument];
  const html = useMemo(
    () => {
      const previewOptions = { highlightMergeFields: true, includeTemplateLabel: false, templates };
      if (activeDocument === "addendum") {
        return renderAddendumHtml(request, false, previewOptions);
      }
      if (activeDocument === "appearance") {
        return renderAppearanceOfCounselHtml(request, false, previewOptions);
      }
      if (activeDocument === "withdrawal") {
        return renderWithdrawalOfCounselHtml(request, false, previewOptions);
      }
      return renderDocumentHtml(request, false, previewOptions);
    },
    [activeDocument, request, templates]
  );
  const missingFieldValues = useMemo(
    () => getMissingPreviewDocumentFieldValues(request, activeDocument, templates),
    [activeDocument, request, templates]
  );
  const missingFieldStatus = `${missingFieldValues.length} missing ${missingFieldValues.length === 1 ? "value" : "values"}`;
  const missingFieldTooltip = missingFieldValues.length
    ? `Missing: ${missingFieldValues.map((field) => field.label).join(", ")}`
    : "No missing field values.";
  const missingFieldStatusClass = missingFieldValues.length ? "warn" : "";
  const documentOptions: { id: PreviewDocumentType; label: string }[] = [
    { id: "qdro", label: "QDRO" },
    ...(hasAddendum ? [{ id: "addendum" as const, label: "Addendum" }] : []),
    { id: "appearance", label: "Appearance" },
    { id: "withdrawal", label: "Withdrawal" }
  ];

  useEffect(() => {
    if (!hasAddendum && activeDocument === "addendum") {
      setActiveDocument("qdro");
    }
  }, [activeDocument, hasAddendum]);

  useEffect(() => {
    setGoogleDocResults({});
    setNeedsGoogleConnection(false);
  }, [request.id]);

  async function createGoogleDoc() {
    const documentType = activeDocument;
    setIsCreatingGoogleDoc(true);
    setGoogleDocResults((currentResults) => ({
      ...currentResults,
      [documentType]: undefined
    }));
    setNeedsGoogleConnection(false);
    try {
      const response = await fetch("/api/documents/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType, format: "google-doc", request })
      });
      const result = (await response.json()) as { message?: string; webViewLink?: string };
      if (!response.ok) {
        setGoogleDocResults((currentResults) => ({
          ...currentResults,
          [documentType]: {
            status: result.message || "Google Docs export is not configured yet.",
            url: ""
          }
        }));
        setNeedsGoogleConnection(response.status === 401 || result.message?.includes("Google Drive is not connected") || false);
        return;
      }
      setGoogleDocResults((currentResults) => ({
        ...currentResults,
        [documentType]: {
          status: result.message || "Google Doc created.",
          url: result.webViewLink || ""
        }
      }));
    } catch {
      setGoogleDocResults((currentResults) => ({
        ...currentResults,
        [documentType]: {
          status: "Google Docs export failed. Check the server configuration and try again.",
          url: ""
        }
      }));
    } finally {
      setIsCreatingGoogleDoc(false);
    }
  }

  async function attachDocument() {
    if (!onAttachDocument) return;
    setIsAttaching(true);
    setAttachmentStatus("");
    try {
      setAttachmentStatus(await onAttachDocument(activeDocument, "docx"));
    } catch (error) {
      setAttachmentStatus(error instanceof Error ? error.message : "Could not attach document.");
    } finally {
      setIsAttaching(false);
    }
  }

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <div className="preview-status-row">
            <span className="status info">Live preview</span>
            <span
              className={`status ${missingFieldStatusClass} missing-field-status`}
              data-missing-fields={missingFieldTooltip}
              aria-label={missingFieldTooltip}
              tabIndex={0}
            >
              {missingFieldStatus}
            </span>
          </div>
          {activeGoogleDoc?.status && (
            <p className="preview-action-status google-doc-status">
              {activeGoogleDoc.status} {activeGoogleDoc.url && <a className="muted-link" href={activeGoogleDoc.url} target="_blank">Open Google Doc</a>}
            </p>
          )}
          {attachmentStatus && <p className="preview-action-status" role="status">{attachmentStatus}</p>}
        </div>
        <div className="preview-actions">
          <div className="document-preview-tabs" aria-label="Preview document">
            {documentOptions.map((option) => (
              <button
                className={activeDocument === option.id ? "active" : ""}
                key={option.id}
                type="button"
                disabled={isAttaching}
                onClick={() => { setActiveDocument(option.id); setAttachmentStatus(""); }}
              >
                {option.label}
              </button>
            ))}
          </div>
          {needsGoogleConnection && (
            <a className="button secondary" href="/api/google/oauth/start" target="_blank">
              Connect Google Drive
            </a>
          )}
          <button className="button secondary" type="button" onClick={createGoogleDoc} disabled={isCreatingGoogleDoc}>
            {isCreatingGoogleDoc ? "Generating..." : "Generate Google Doc"}
          </button>
          {onAttachDocument && (
            <button className="button primary" type="button" onClick={() => void attachDocument()} disabled={isAttaching}>
              {isAttaching ? "Attaching..." : "Attach Word document (.docx) to client"}
            </button>
          )}
        </div>
      </div>
      <div className="preview-document" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

function hasAddendumDocument(request: QdroRequest) {
  const planFamily = String(request.fields.plan_family || request.templateFamily).trim();
  const accountType = String(request.fields.account_type || "").trim();
  return planFamily === "URS" || (planFamily === "TSP" && accountType === "TSP");
}
