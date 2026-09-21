"use client";

import { useMemo, useState } from "react";
import { renderDocumentHtml } from "@/lib/document-engine";
import type { QdroRequest } from "@/lib/types";

export function DocumentPreview({ request }: { request: QdroRequest }) {
  const [masked, setMasked] = useState(true);
  const html = useMemo(() => renderDocumentHtml(request, masked), [request, masked]);

  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <span className="status info">Live preview</span>
          <h2 style={{ marginTop: 12 }}>Draft document preview</h2>
          <p>
            This preview uses the same field data as the export engine. Sensitive
            fields are masked by default.
          </p>
        </div>
        <button className="button secondary" type="button" onClick={() => setMasked((current) => !current)}>
          {masked ? "Reveal sensitive fields" : "Mask sensitive fields"}
        </button>
      </div>
      <div className="preview-document" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
