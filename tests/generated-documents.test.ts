import assert from "node:assert/strict";
import test from "node:test";
import { documentHtmlToRtf } from "../lib/document-rtf";
import { renderGeneratedDocumentHtml } from "../lib/generated-documents";
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

test("approval signature lines fit their RTF cell using an underline tab leader", () => {
  const rtf = documentHtmlToRtf(renderGeneratedDocumentHtml(demoRequest, "qdro", documentTemplates));
  const signatureRows = rtf.split("\\trowd").filter((row) => row.includes("Approved as to form:"));
  assert.equal(signatureRows.length, 2);
  for (const row of signatureRows) {
    assert.ok(row.includes("\\tqr\\tlul\\tx4520"));
    assert.ok(row.includes("Approved as to form:\\tab "));
    assert.ok(!/Approved as to form:\s*_+/.test(row));
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
