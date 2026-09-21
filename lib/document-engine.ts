import { Document, Packer, Paragraph, TextRun } from "docx";
import { documentTemplates } from "./content";
import type { DocumentTemplate, QdroRequest } from "./types";

function value(fields: QdroRequest["fields"], key: string) {
  const raw = fields[key];
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  return raw || "";
}

export function deriveDocumentData(request: QdroRequest, maskSensitive = false) {
  const owner = value(request.fields, "account_owner");
  const party1 = {
    name: value(request.fields, "party1_name"),
    ssn: value(request.fields, "party1_ssn"),
    dob: value(request.fields, "party1_dob")
  };
  const party2 = {
    name: value(request.fields, "party2_name"),
    ssn: value(request.fields, "party2_ssn"),
    dob: value(request.fields, "party2_dob")
  };
  const participant = owner === "Party 2" ? party2 : party1;
  const alternate = owner === "Party 2" ? party1 : party2;
  const divisionType = value(request.fields, "division_type");
  const awardText =
    divisionType === "Fixed amount"
      ? `$${value(request.fields, "fixed_award") || "0"}`
      : divisionType === "Percentage"
        ? `${value(request.fields, "percent_award") || "0"}%`
        : "to be confirmed by UtahQDRO";

  return {
    case_number: value(request.fields, "case_number"),
    court_county: value(request.fields, "court_county").toUpperCase(),
    judge_name: value(request.fields, "judge_name"),
    divorce_date: value(request.fields, "divorce_date"),
    formal_plan_name: value(request.fields, "formal_plan_name"),
    participant_name: participant.name,
    participant_ssn: maskSensitive ? maskSsn(participant.ssn) : participant.ssn,
    participant_dob: participant.dob,
    alternate_payee_name: alternate.name,
    alternate_payee_ssn: maskSensitive ? maskSsn(alternate.ssn) : alternate.ssn,
    alternate_payee_dob: alternate.dob,
    award_text: awardText,
    valuation_date: value(request.fields, "valuation_date") || "to be confirmed",
    special_terms: value(request.fields, "special_terms") || "None stated."
  };
}

export function maskSsn(ssn: string) {
  if (!ssn) return "";
  const last = ssn.replace(/\D/g, "").slice(-4);
  return last ? `xxx-xx-${last}` : "xxx-xx-xxxx";
}

export function selectTemplate(request: QdroRequest): DocumentTemplate {
  return (
    documentTemplates.find((template) => template.family === request.templateFamily && template.active) ||
    documentTemplates.find((template) => template.family === String(request.fields.plan_family) && template.active) ||
    documentTemplates[1]
  );
}

export function renderTemplate(template: DocumentTemplate, request: QdroRequest, maskSensitive = false) {
  const data = deriveDocumentData(request, maskSensitive);
  return template.body.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const cleanKey = key.trim() as keyof typeof data;
    return String(data[cleanKey] ?? "");
  });
}

export function renderDocumentHtml(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = renderTemplate(template, request, maskSensitive);
  const paragraphs = rendered
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `<article><h2>${escapeHtml(template.name)}</h2>${paragraphs}</article>`;
}

export function renderRtf(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = renderTemplate(template, request, maskSensitive);
  const safe = rendered
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24\\b ${template.name}\\b0\\par ${safe}}`;
}

export async function renderDocxBuffer(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = renderTemplate(template, request, maskSensitive);
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: template.name, bold: true, size: 28 })]
          }),
          ...rendered.split("\n").map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line || " ", size: 24 })]
              })
          )
        ]
      }
    ]
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

function escapeHtml(valueToEscape: string) {
  return valueToEscape
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
