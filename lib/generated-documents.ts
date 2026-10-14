import {
  renderAddendumHtml,
  renderAppearanceOfCounselHtml,
  renderDocumentHtml,
  renderWithdrawalOfCounselHtml
} from "./document-engine";
import type { DocumentTemplate, QdroRequest } from "./types";
import { documentHtmlToRtf } from "./document-rtf";

export type GeneratedDocumentType = "qdro" | "appearance" | "withdrawal" | "addendum";
export type GeneratedDocumentFormat = "pdf" | "rtf";

export const generatedDocumentLabels: Record<GeneratedDocumentType, string> = {
  qdro: "QDRO Draft",
  appearance: "Appearance of Counsel",
  withdrawal: "Withdrawal of Counsel",
  addendum: "Addendum"
};

export function renderGeneratedDocumentHtml(request: QdroRequest, documentType: GeneratedDocumentType, templates: DocumentTemplate[]) {
  const options = { templates, includeTemplateLabel: false, wrapDocument: false, wrapBody: false };
  switch (documentType) {
    case "appearance": return renderAppearanceOfCounselHtml(request, false, options);
    case "withdrawal": return renderWithdrawalOfCounselHtml(request, false, options);
    case "addendum": return renderAddendumHtml(request, false, options);
    case "qdro": return renderDocumentHtml(request, false, options);
  }
}

export async function generateDocumentFile(html: string, format: GeneratedDocumentFormat): Promise<Buffer> {
  if (format === "rtf") {
    return Buffer.from(documentHtmlToRtf(html), "ascii");
  }

  const [{ default: puppeteer }, { default: chromium }] = await Promise.all([
    import("puppeteer-core"), import("@sparticuz/chromium")
  ]);
  // Local development can use an installed Chrome; Linux deployments use the bundled browser.
  const localChrome = process.env.PUPPETEER_EXECUTABLE_PATH ||
    (process.platform === "darwin" ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" : "");
  const browser = await puppeteer.launch({
    executablePath: localChrome || await chromium.executablePath(),
    args: localChrome ? [] : chromium.args,
    headless: true
  });
  try {
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    // Templates do not need network access to render. Block remote resources and scripts.
    await page.setRequestInterception(true);
    page.on("request", (request) => { void request.abort(); });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      body { margin: 0; font-family: "Times New Roman", serif; font-size: 12pt; line-height: 14pt; color: #000; }
      * { box-sizing: border-box; }
      table { max-width: 100%; }
      tr { break-inside: avoid; }
    </style></head><body>${html}</body></html>`, { waitUntil: "load" });
    return Buffer.from(await page.pdf({
      format: "Letter", printBackground: true,
      margin: { top: "1in", right: "1in", bottom: "1in", left: "1in" }
    }));
  } finally {
    await browser.close();
  }
}
