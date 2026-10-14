import assert from "node:assert/strict";
import test from "node:test";
import { documentHtmlToRtf } from "../lib/document-rtf";
import { generateDocumentFile, renderGeneratedDocumentHtml } from "../lib/generated-documents";
import { demoRequest, documentTemplates } from "../lib/content";

test("RTF escapes control characters and preserves Unicode", () => {
  const rtf = documentHtmlToRtf("<p>José {draft} \\ 😀</p>");
  assert.ok(rtf.startsWith("{\\rtf1"));
  assert.ok(rtf.includes("\\u233?"));
  assert.ok(rtf.includes("\\{draft\\}"));
  assert.ok(rtf.includes("\\\\"));
  assert.ok(rtf.includes("\\u-10179?\\u-8704?"));
});

test("signature tables preserve two borderless columns", () => {
  const rtf = documentHtmlToRtf('<table style="border:none"><tr><td>DATE</td><td>SIGNATURE</td></tr></table>');
  assert.ok(rtf.includes("\\cellx4680"));
  assert.ok(rtf.includes("\\cellx9360"));
  assert.ok(rtf.includes("\\brdrnil"));
  assert.ok(!rtf.includes("\\brdrs"));
});

test("caption tables preserve merged headings and intended borders", () => {
  const rtf = documentHtmlToRtf('<table><tr><td colspan="2" style="border:1px solid #000000">COURT</td></tr><tr><td>PARTIES</td><td>ORDER</td></tr></table>');
  assert.ok(rtf.includes("\\clmgf"));
  assert.ok(rtf.includes("\\clmrg"));
  assert.ok(rtf.includes("\\brdrs"));
  assert.ok(rtf.includes("COURT"));
});

test("QDRO caption columns preserve matching top and bottom padding", () => {
  const html = renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates);
  const rtf = documentHtmlToRtf(html);
  const captionRow = rtf.split("\\trowd").find((row) => row.includes("In the Matter of the Marriage of"));
  assert.ok(captionRow);
  assert.ok(captionRow.includes("QUALIFIED DOMESTIC RELATIONS ORDER"));
  assert.equal((captionRow.match(/\\clpadt360\\clpadft3\\clpadb360\\clpadfb3/g) || []).length, 2);
});

test("explicit cell padding overrides shorthand padding", () => {
  const rtf = documentHtmlToRtf('<table><tr><td style="padding: 12pt 0 18pt; padding-top: 6pt; padding-bottom: 9pt">Caption</td></tr></table>');
  assert.ok(rtf.includes("\\clpadt120\\clpadft3\\clpadb180\\clpadfb3"));
});

test("caption ends after the Judge text without an extra blank line inside the cell", () => {
  const rtf = documentHtmlToRtf(renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates));
  const captionRow = rtf.split("\\trowd").find((row) => row.includes("In the Matter of the Marriage of"));
  assert.ok(captionRow);
  assert.ok(captionRow.includes("Judge "));
  assert.ok(!/\\line\s*\}\s*\\cell/.test(captionRow));
  assert.equal((captionRow.match(/\\clpadb360\\clpadfb3/g) || []).length, 2);
});

test("court notice retains its 12-point top spacing", () => {
  const rtf = documentHtmlToRtf(renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates));
  const footer = rtf.split("\\pard").find((paragraph) => paragraph.includes("THIS IS THE SIGNED ORDER OF THE COURT"));
  assert.ok(footer);
  assert.ok(footer.includes("\\sb240"));
  assert.ok(footer.includes("\\qc"));
  assert.ok(footer.includes("\\i"));
});

test("court headings have consistent spacing below STATE OF UTAH", () => {
  for (const type of ["qdro", "appearance", "withdrawal"] as const) {
    const rtf = documentHtmlToRtf(renderGeneratedDocumentHtml(demoRequest, type, documentTemplates));
    const stateRow = rtf.split("\\trowd").find((row) => row.includes("STATE OF UTAH"));
    assert.ok(stateRow, type);
    assert.ok(stateRow.includes("\\clpadb240\\clpadfb3"), type);
  }
});

test("approval section uses one heading and two simple name/date rows", () => {
  const html = renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates);
  const signature = html.match(/<table class="signature-block"[\s\S]*?<\/table>/)?.[0];
  assert.ok(signature);
  assert.equal((html.match(/Approved as to form:/g) || []).length, 1);
  assert.equal((signature.match(/Date:/g) || []).length, 2);
  assert.equal((signature.match(/Signed Electronically/g) || []).length, 2);
  assert.ok(!signature.includes("____"));
  assert.ok(!signature.includes("<br"));
  const rtf = documentHtmlToRtf(html);
  const rows = rtf.split("\\trowd").filter((row) => row.includes("Signed Electronically"));
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.ok(row.includes("Date:"));
    assert.ok(row.includes("\\brdrnil"));
  }
});

test("generates only the selected document using current preview values", () => {
  const request = { ...demoRequest, fields: { ...demoRequest.fields, party1_name: "Updated Preview Name" } };
  const qdro = renderGeneratedDocumentHtml(request, "qdro", documentTemplates);
  assert.ok(qdro.includes("Updated Preview Name"));
  assert.ok(!qdro.includes("LIMITED APPEARANCE OF COUNSEL"));
  assert.ok(!qdro.includes("<mark"));
  const appearance = renderGeneratedDocumentHtml(request, "appearance", documentTemplates);
  assert.ok(appearance.includes("LIMITED APPEARANCE OF COUNSEL"));
  assert.ok(!appearance.includes("WHEREAS"));
  const withdrawal = renderGeneratedDocumentHtml(request, "withdrawal", documentTemplates);
  assert.ok(withdrawal.includes("WITHDRAWAL"));
  assert.ok(!withdrawal.includes("WHEREAS"));
});

test("saved custom template content is used in generated documents", () => {
  const templates = documentTemplates.map((template) => template.id === "appearance-of-counsel-v1"
    ? { ...template, htmlBody: "<p>Custom saved text {{party1_name}}</p>" } : template);
  const html = renderGeneratedDocumentHtml(demoRequest, "appearance", templates);
  assert.ok(html.includes("Custom saved text"));
  assert.ok(!html.includes("{{party1_name}}"));
});


test("plan directory uses document template routing for each offered plan and account type", async () => {
  const { offeredPlans, matchedPlanTemplate } = await import("../lib/plan-directory");
  const { selectTemplateFromList } = await import("../lib/document-engine");
  for (const plan of offeredPlans) {
    const request = { ...demoRequest, templateFamily: plan.entity, fields: { plan_family: plan.entity, account_type: plan.accountType } };
    assert.equal(matchedPlanTemplate(plan).id, selectTemplateFromList(request, documentTemplates).id);
  }
  assert.equal(matchedPlanTemplate({ entity: "DMBA", accountType: "Pension" }).id, "dmba-pension-v1");
  assert.equal(matchedPlanTemplate({ entity: "URS", accountType: "457 plan" }).id, "urs-defined-contribution-v1");
  assert.equal(matchedPlanTemplate({ entity: "Kroger", accountType: "401k plan" }).id, "multi-template-v1");
  assert.ok(offeredPlans.some((plan) => plan.entity === "Kroger" && plan.accountType === "401k plan"));
});


test("DOCX contains editable template text, tables, and Letter page settings", async () => {
  const JSZip = require("jszip");
  for (const type of ["qdro", "appearance", "withdrawal", "addendum"] as const) {
    const html = renderGeneratedDocumentHtml(demoRequest, type, documentTemplates);
    const buffer = await generateDocumentFile(html, "docx");
    assert.equal(buffer.subarray(0, 2).toString(), "PK");
    const zip = await JSZip.loadAsync(buffer);
    const xml = await zip.file("word/document.xml").async("string");
    assert.ok(xml.includes("<w:t"), type);
    assert.ok(xml.includes("<w:tbl>"), type);
    assert.ok(xml.includes('w:w="12240"'), type);
    assert.ok(xml.includes('w:h="15840"'), type);
    assert.ok(!xml.includes("{{party1_name}}"), type);
    assert.ok(!xml.includes("altChunk"), type);
    const styles = await zip.file("word/styles.xml").async("string");
    assert.ok(styles.includes("Times New Roman"), type);
    assert.ok(styles.includes('w:val="24"'), type);
  }
});


test("Word captions retain equal vertical padding and space at the column divider", async () => {
  const JSZip = require("jszip");
  for (const type of ["qdro", "appearance", "withdrawal"] as const) {
    const zip = await JSZip.loadAsync(await generateDocumentFile(renderGeneratedDocumentHtml(demoRequest, type, documentTemplates), "docx"));
    const xml = await zip.file("word/document.xml").async("string");
    const cells: string[] = xml.match(/<w:tc>[\s\S]*?<\/w:tc>/g) || [];
    const parties = cells.find((cell) => cell.includes("In the Matter of the Marriage of"));
    const title = { qdro: "QUALIFIED DOMESTIC RELATIONS ORDER", appearance: "LIMITED APPEARANCE OF COUNSEL", withdrawal: "WITHDRAWAL OF COUNSEL" }[type];
    const details = cells.find((cell) => cell.includes(title));
    assert.ok(parties, type);
    assert.ok(details, type);
    for (const cell of [parties, details]) {
      assert.ok(cell.includes('<w:top w:w="360" w:type="dxa"/>'), type);
      assert.ok(cell.includes('<w:bottom w:w="360" w:type="dxa"/>'), type);
    }
    assert.ok(parties.includes('<w:right w:w="240" w:type="dxa"/>'), type);
    assert.ok(details.includes('<w:left w:w="280" w:type="dxa"/>'), type);
    assert.ok(!cells.filter((cell) => cell.includes("Approved as to form:")).some((cell) => cell.includes("<w:tcMar>")));
  }
});


test("Google export puts a single caption gap on the first WHEREAS paragraph", () => {
  const html = renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates);
  const firstParagraph = html.match(/<p[^>]*>WHEREAS this Court[^<]*<\/p>/)?.[0];
  assert.ok(firstParagraph);
  assert.ok(firstParagraph.includes("margin-top: 12pt;"));
  assert.ok(firstParagraph.includes("margin: 0 0 12pt;"));
  assert.match(html, /<\/table>\s*<p[^>]*>WHEREAS this Court/);
});


test("Google import uses one fixed caption spacer without stacked margins", async () => {
  const { prepareGoogleDocumentHtml } = await import("../lib/google-document-html");
  const html = prepareGoogleDocumentHtml(renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates));
  assert.match(html, /<\/table><p style="[^"]*height: 12pt;[^"]*">&nbsp;<\/p><p[^>]*>WHEREAS this Court/);
  assert.ok(!html.includes("margin-top: 12pt;"));
  assert.equal((html.match(/padding: 0; height: 12pt;/g) || []).length, 1);
  assert.equal(prepareGoogleDocumentHtml(html), html);
});


test("Word court headings span the page and first body paragraph clears the caption", async () => {
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(await generateDocumentFile(renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates), "docx"));
  const xml = await zip.file("word/document.xml").async("string");
  const headings = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).find((table: string) => table.includes("STATE OF UTAH"));
  assert.ok(headings);
  assert.equal((headings.match(/<w:tcW w:w="9360" w:type="dxa"\/>/g) || []).length, 2);
  const firstWhereas = (xml.match(/<w:p>[\s\S]*?<\/w:p>/g) || []).find((paragraph: string) => paragraph.includes("WHEREAS"));
  assert.ok(firstWhereas);
  assert.ok(firstWhereas.includes('w:before="240"'));
});


test("Word captions lock both columns to half the page width", async () => {
  const JSZip = require("jszip");
  for (const type of ["qdro", "appearance", "withdrawal"] as const) {
    const zip = await JSZip.loadAsync(await generateDocumentFile(renderGeneratedDocumentHtml(demoRequest, type, documentTemplates), "docx"));
    const xml = await zip.file("word/document.xml").async("string");
    const caption = (xml.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || []).find((table: string) => table.includes("In the Matter of the Marriage of"));
    assert.ok(caption, type);
    assert.ok(caption.includes('<w:tblLayout w:type="fixed"/>'), type);
    assert.equal((caption.match(/<w:gridCol w:w="4680"\/>/g) || []).length, 2, type);
    assert.equal((caption.match(/<w:tcW w:w="4680" w:type="dxa"\/>/g) || []).length, 2, type);
  }
});


test("Google appearance and withdrawal use compact headings and one caption gap", async () => {
  const { prepareGoogleDocumentHtml } = await import("../lib/google-document-html");
  for (const type of ["appearance", "withdrawal"] as const) {
    const html = prepareGoogleDocumentHtml(renderGeneratedDocumentHtml(demoRequest, type, documentTemplates));
    assert.match(html, /<\/table><p style="[^"]*height: 12pt;[^"]*">&nbsp;<\/p><p[^>]*>\s*COMES NOW/);
    const heading = (html.match(/<table\b[^>]*>[\s\S]*?<\/table>/g) || []).find((table) => table.includes("STATE OF UTAH"));
    assert.ok(heading);
    assert.ok(heading.includes("border: none; padding: 0;"));
    assert.ok(!heading.includes("padding: 0 0 12pt;"));
    assert.equal((heading.match(/<p style=/g) || []).length, 2);
    assert.equal((html.match(/padding: 0; height: 12pt;/g) || []).length, 1);
    assert.equal(prepareGoogleDocumentHtml(html), html);
  }
});


test("every offered QDRO plan gets one Google caption gap regardless of opening text", async () => {
  const { prepareGoogleDocumentHtml } = await import("../lib/google-document-html");
  const { offeredPlans } = await import("../lib/plan-directory");
  for (const plan of offeredPlans) {
    const request = { ...demoRequest, templateFamily: plan.entity, fields: { ...demoRequest.fields, plan_family: plan.entity, account_type: plan.accountType } };
    const html = prepareGoogleDocumentHtml(renderGeneratedDocumentHtml(request, "qdro", documentTemplates));
    const captionAndBody = html.slice(html.indexOf("In the Matter of the Marriage of"));
    assert.match(captionAndBody, /<\/table><p style="[^"]*height: 12pt;[^"]*">&nbsp;<\/p><p/);
    assert.equal((html.match(/padding: 0; height: 12pt;/g) || []).length, 1, `${plan.entity} ${plan.accountType}`);
    assert.ok(!html.includes("margin-top: 12pt;"));
    assert.equal(prepareGoogleDocumentHtml(html), html);
  }
});
