import { Document, Packer, Paragraph, TextRun } from "docx";
import { documentTemplates } from "./content";
import type { DocumentTemplate, QdroRequest } from "./types";
import { findUtahCourt } from "./utah-courts";

function value(fields: QdroRequest["fields"], key: string) {
  const raw = fields[key];
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  return raw || "";
}

export function deriveDocumentData(request: QdroRequest, maskSensitive = false) {
  const court = findUtahCourt(value(request.fields, "court_location"));
  const owner = value(request.fields, "account_owner");
  const party1Name = value(request.fields, "party1_name");
  const party2Name = value(request.fields, "party2_name");
  const party1 = {
    name: party1Name,
    ssn: value(request.fields, "party1_ssn"),
    dob: value(request.fields, "party1_dob"),
    email: value(request.fields, "party1_email"),
    phone: value(request.fields, "party1_phone"),
    address: value(request.fields, "party1_address")
  };
  const party2 = {
    name: party2Name,
    ssn: value(request.fields, "party2_ssn"),
    dob: value(request.fields, "party2_dob"),
    email: value(request.fields, "party2_email"),
    phone: value(request.fields, "party2_phone"),
    address: value(request.fields, "party2_address")
  };
  const participant = owner === "Party 2" ? party2 : party1;
  const alternate = owner === "Party 2" ? party1 : party2;
  const divisionType = value(request.fields, "division_type");
  const percentAward = value(request.fields, "percent_award");
  const awardText =
    divisionType === "Fixed amount"
      ? `$${value(request.fields, "fixed_award") || "0"}`
      : divisionType === "Percentage"
        ? `${percentAward || "0"}%`
        : "to be confirmed by UtahQDRO";
  const amendedText = value(request.fields, "amended_text");
  const entityAccountType = [value(request.fields, "entity_name"), value(request.fields, "account_type")]
    .filter(Boolean)
    .join(" ") || value(request.fields, "formal_plan_name");

  return {
    case_number: value(request.fields, "case_number"),
    district: (court?.district || value(request.fields, "district") || "FOURTH").toUpperCase(),
    court_county: (court?.county || value(request.fields, "court_county")).toUpperCase(),
    judge_name: value(request.fields, "judge_name"),
    marriage_date: formatDisplayDate(value(request.fields, "marriage_date")),
    divorce_date: value(request.fields, "divorce_date"),
    order_title: `${amendedText ? `${amendedText} ` : ""}QUALIFIED DOMESTIC RELATIONS ORDER`,
    counsel_for: value(request.fields, "prepared_for") || request.clientName,
    party1_name_upper: party1Name.toUpperCase(),
    party2_name_upper: party2Name.toUpperCase(),
    entity_account_type: entityAccountType,
    account_type: value(request.fields, "account_type"),
    employer_name: value(request.fields, "employer_name") || "to be confirmed",
    formal_plan_name: value(request.fields, "formal_plan_name"),
    participant_name: participant.name,
    participant_full_address: participant.address || "address to be confirmed",
    participant_ssn: maskSensitive ? maskSsn(participant.ssn) : participant.ssn,
    participant_dob: participant.dob,
    participant_phone: participant.phone,
    participant_email: participant.email,
    alternate_payee_name: alternate.name,
    alternate_full_address: alternate.address || "address to be confirmed",
    alternate_payee_ssn: maskSensitive ? maskSsn(alternate.ssn) : alternate.ssn,
    alternate_payee_dob: alternate.dob,
    alternate_payee_phone: alternate.phone,
    alternate_payee_email: alternate.email,
    award_text: awardText,
    percent_amount: divisionType === "Fixed amount" ? "50%" : `${percentAward || "0"}%`,
    valuation_date: formatDisplayDate(value(request.fields, "valuation_date")) || "the Date of Transfer",
    adjust_market: value(request.fields, "market_adjustment").toLowerCase() === "no" ? "is not" : "is",
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
  const source = template.format === "html" ? template.htmlBody || "" : template.body || "";
  return source.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const cleanKey = key.trim() as keyof typeof data;
    const merged = String(data[cleanKey] ?? "");
    return template.format === "html" ? escapeHtml(merged) : merged;
  });
}

export function renderDocumentHtml(request: QdroRequest, maskSensitive = false, options: { includeTemplateLabel?: boolean } = {}) {
  const template = selectTemplate(request);
  const rendered = inlineDocumentStyles(renderTemplate(template, request, maskSensitive));
  if (template.format === "html") {
    const templateLabel = options.includeTemplateLabel === false
      ? ""
      : `<div style="margin: 0 0 12pt; color: #64748b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(template.name)} · configurable template v${template.version}</div>`;
    return `<article style="max-width: 8.5in; margin: 0 auto; color: #000000; font-family: Times New Roman; font-size: 12pt; line-height: 14pt;">${templateLabel}${rendered}</article>`;
  }
  const paragraphs = rendered
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return `<article style="font-family: Times New Roman; font-size: 12pt; line-height: 14pt;"><h2>${escapeHtml(template.name)}</h2>${paragraphs}</article>`;
}

function inlineDocumentStyles(html: string) {
  const paragraphStyle = "margin: 0 0 12pt; line-height: 14pt; font-family: Times New Roman; font-size: 12pt; color: #000000;";
  const indentStyle = `${paragraphStyle} text-indent: 0.5in;`;
  const subindentStyle = `${paragraphStyle} padding-left: 0.5in; text-indent: 0.5in;`;
  const headingStyle = "margin: 12pt 0 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000; text-align: center; text-transform: uppercase;";
  const footerStyle = `${paragraphStyle} text-align: center;`;

  return html
    .replace(/<p>/g, `<p style="${paragraphStyle}">`)
    .replace(/<p class="indent">/g, `<p style="${indentStyle}">`)
    .replace(/<p class="subindent">/g, `<p style="${subindentStyle}">`)
    .replace(/<p class="court-heading"(?: style="[^"]*")?>/g, `<p style="${headingStyle}">`)
    .replace(/<p class="court-footer">/g, `<p style="${footerStyle}">`);
}

export function renderRtf(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = stripHtml(renderTemplate(template, request, maskSensitive));
  const safe = rendered
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24\\b ${template.name}\\b0\\par ${safe}}`;
}

export async function renderDocxBuffer(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = stripHtml(renderTemplate(template, request, maskSensitive));
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

function stripHtml(valueToStrip: string) {
  return valueToStrip
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function formatDisplayDate(valueToFormat: string) {
  if (!valueToFormat) return "";
  const date = new Date(`${valueToFormat}T00:00:00`);
  if (Number.isNaN(date.getTime())) return valueToFormat;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}
