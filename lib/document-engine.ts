import { documentTemplates } from "./content";
import { formatLongDate } from "./field-format";
import type { DocumentTemplate, QdroRequest } from "./types";
import { findUtahCourt } from "./utah-courts";

function value(fields: QdroRequest["fields"], key: string) {
  const raw = fields[key];
  if (typeof raw === "boolean") return raw ? "Yes" : "No";
  return raw || "";
}

export function deriveDocumentData(request: QdroRequest, maskSensitive = false) {
  const court = findUtahCourt(value(request.fields, "court_location"));
  const owner = normalizePartyChoice(value(request.fields, "account_owner")) || "Party 1";
  const awardee = normalizePartyChoice(value(request.fields, "account_awardee")) || (owner === "Party 2" ? "Party 1" : "Party 2");
  const party1Name = value(request.fields, "party1_name");
  const party2Name = value(request.fields, "party2_name");
  const party1 = {
    name: party1Name,
    ssn: value(request.fields, "party1_ssn"),
    dob: value(request.fields, "party1_dob"),
    email: value(request.fields, "party1_email"),
    phone: value(request.fields, "party1_phone"),
    address: formatMailingAddress(request.fields, "party1")
  };
  const party2 = {
    name: party2Name,
    ssn: value(request.fields, "party2_ssn"),
    dob: value(request.fields, "party2_dob"),
    email: value(request.fields, "party2_email"),
    phone: value(request.fields, "party2_phone"),
    address: formatMailingAddress(request.fields, "party2")
  };
  const participant = owner === "Party 2" ? party2 : party1;
  const alternate = awardee === "Party 2" ? party2 : party1;
  const divisionType = value(request.fields, "division_type");
  const percentAward = value(request.fields, "percent_award");
  const fixedAward = value(request.fields, "fixed_award");
  const awardText =
    divisionType === "Fixed amount" && fixedAward
      ? formatCurrencyValue(fixedAward)
      : divisionType === "Percentage"
        ? `${percentAward || "50"}%`
        : "50%";
  const amendedText = value(request.fields, "amended_text");
  const entityAccountType = [value(request.fields, "entity_name"), value(request.fields, "account_type")]
    .filter(Boolean)
    .join(" ") || value(request.fields, "formal_plan_name");

  return {
    case_number: value(request.fields, "case_number"),
    district: (court?.district || value(request.fields, "district") || "FOURTH").toUpperCase(),
    court_county: (court?.county || value(request.fields, "court_county")).toUpperCase(),
    judge_name: value(request.fields, "judge_name"),
    marriage_date: formatLongDate(value(request.fields, "marriage_date")),
    divorce_date: formatLongDate(value(request.fields, "divorce_date")),
    current_date: new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date()),
    order_title: `${amendedText ? `${amendedText} ` : ""}QUALIFIED DOMESTIC RELATIONS ORDER`,
    counsel_for: value(request.fields, "prepared_for") || request.clientName,
    party1_name: party1Name,
    party1_name_upper: party1Name.toUpperCase(),
    party1_email: party1.email,
    party2_name: party2Name,
    party2_name_upper: party2Name.toUpperCase(),
    party2_email: party2.email,
    entity_account_type: entityAccountType,
    account_type: value(request.fields, "account_type"),
    employer_name: value(request.fields, "employer_name") || "to be confirmed",
    employer_phone: value(request.fields, "employer_phone"),
    employer_full_address: formatMailingAddress(request.fields, "employer"),
    employer_fax: value(request.fields, "employer_fax"),
    employer_email: value(request.fields, "employer_email"),
    formal_plan_name: value(request.fields, "formal_plan_name"),
    plan_account_number: value(request.fields, "plan_account_number"),
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
    percent_amount: divisionType === "Fixed amount" && fixedAward ? formatCurrencyValue(fixedAward) : `${percentAward || "50"}%`,
    valuation_date: formatLongDate(value(request.fields, "valuation_date")) || "the Date of Transfer",
    adjust_market: getMarketAdjustmentText(value(request.fields, "market_adjustment")),
    special_terms: value(request.fields, "special_terms") || "None stated."
  };
}

function normalizePartyChoice(choice: string) {
  if (choice.startsWith("Party 1")) return "Party 1";
  if (choice.startsWith("Party 2")) return "Party 2";
  return choice === "Party 1" || choice === "Party 2" ? choice : "";
}

function getMarketAdjustmentText(adjustment: string) {
  const normalized = adjustment.toLowerCase();
  if (normalized.includes("excluded") || normalized === "no") return "is not";
  return "is";
}

function formatCurrencyValue(amount: string) {
  const numericAmount = Number(amount.replace(/[$,]/g, ""));
  if (!Number.isFinite(numericAmount)) return amount || "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(numericAmount);
}

function formatMailingAddress(fields: QdroRequest["fields"], prefix: "party1" | "party2" | "employer") {
  const cityStateZip = [
    value(fields, `${prefix}_address_city`),
    [value(fields, `${prefix}_address_state`), value(fields, `${prefix}_address_zip`)].filter(Boolean).join(" ")
  ].filter(Boolean).join(", ");
  const structuredAddress = [
    value(fields, `${prefix}_address_street`),
    value(fields, `${prefix}_address_line2`),
    cityStateZip
  ].filter(Boolean).join(", ");

  return structuredAddress || value(fields, `${prefix}_address`);
}

export function maskSsn(ssn: string) {
  if (!ssn) return "";
  const last = ssn.replace(/\D/g, "").slice(-4);
  return last ? `xxx-xx-${last}` : "xxx-xx-xxxx";
}

export function selectTemplate(request: QdroRequest): DocumentTemplate {
  return selectTemplateFromList(request, documentTemplates);
}

export function selectTemplateFromList(request: QdroRequest, templates: DocumentTemplate[]): DocumentTemplate {
  const fallbackTemplate =
    templates.find((template) => template.id === "general-v1" && template.active) ||
    templates.find((template) => template.family === "Multi-template / other" && template.active) ||
    documentTemplates.find((template) => template.id === "general-v1" && template.active) ||
    documentTemplates.find((template) => template.family === "Multi-template / other" && template.active) ||
    templates.find((template) => template.active) ||
    documentTemplates.find((template) => template.active) ||
    documentTemplates[0];

  return (
    templates.find((template) => template.family === request.templateFamily && template.active) ||
    templates.find((template) => template.family === String(request.fields.plan_family) && template.active) ||
    fallbackTemplate
  );
}

type RenderDocumentOptions = {
  highlightMergeFields?: boolean;
  includeTemplateLabel?: boolean;
  templates?: DocumentTemplate[];
  wrapDocument?: boolean;
  wrapBody?: boolean;
};

export function renderTemplate(template: DocumentTemplate, request: QdroRequest, maskSensitive = false, options: RenderDocumentOptions = {}) {
  const data = deriveDocumentData(request, maskSensitive);
  const source = getEditableTemplateBody(template);
  return source.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const cleanKey = key.trim() as keyof typeof data;
    const merged = String(data[cleanKey] ?? "");
    return renderMergedValue(merged, options.highlightMergeFields, cleanKey);
  });
}

const commonShellMergeFields = [
  "counsel_for",
  "district",
  "court_county",
  "party1_name_upper",
  "party2_name_upper",
  "order_title",
  "entity_account_type",
  "case_number",
  "judge_name",
  "current_date",
  "participant_name",
  "alternate_payee_name"
];

export function getMissingTemplateFieldValues(request: QdroRequest, templates?: DocumentTemplate[]) {
  const template = templates ? selectTemplateFromList(request, templates) : selectTemplate(request);
  return getMissingFieldValuesForTemplate(request, template, commonShellMergeFields);
}

export function getMissingPreviewDocumentFieldValues(
  request: QdroRequest,
  documentType: "qdro" | "appearance" | "withdrawal",
  templates?: DocumentTemplate[]
) {
  const availableTemplates = templates || documentTemplates;
  if (documentType === "appearance") {
    return getMissingFieldValuesForTemplate(request, selectAppearanceTemplate(availableTemplates));
  }
  if (documentType === "withdrawal") {
    return getMissingFieldValuesForTemplate(request, selectWithdrawalTemplate(availableTemplates));
  }
  return getMissingTemplateFieldValues(request, templates);
}

function getMissingFieldValuesForTemplate(request: QdroRequest, template: DocumentTemplate, shellMergeFields: string[] = []) {
  const data = deriveDocumentData(request);
  const mergeFields = new Set([...shellMergeFields, ...extractMergeFields(getEditableTemplateBody(template))]);

  return Array.from(mergeFields)
    .filter((field) => !String(data[field as keyof typeof data] ?? "").trim())
    .map((field) => ({
      key: field,
      label: humanizeMergeField(field)
    }));
}

export function getEditableTemplateBody(template: DocumentTemplate) {
  if (template.format === "html") {
    return stripLegacyDocumentShell(template.htmlBody || "");
  }
  return plainTextToTemplateHtml(template.body || "");
}

export function renderDocumentHtml(
  request: QdroRequest,
  maskSensitive = false,
  options: RenderDocumentOptions = {}
) {
  const template = options.templates ? selectTemplateFromList(request, options.templates) : selectTemplate(request);
  const data = deriveDocumentData(request, maskSensitive);
  const rendered = inlineDocumentStyles(renderTemplate(template, request, maskSensitive, options));
  const templateLabel = options.includeTemplateLabel === false
    ? ""
    : `<div style="margin: 0 0 12pt; color: #64748b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(template.name)} · configurable template v${template.version}</div>`;

  const documentBody = `${templateLabel}${renderCommonDocumentShell(rendered, data, {
    highlightMergeFields: options.highlightMergeFields,
    wrapBody: options.wrapBody !== false
  })}`;
  if (options.wrapDocument === false) return documentBody;

  return `<article style="max-width: 8.5in; margin: 0 auto; color: #000000; font-family: Times New Roman; font-size: 12pt; line-height: 14pt;">${documentBody}</article>`;
}

export function renderDocumentPackageHtml(
  request: QdroRequest,
  maskSensitive = false,
  options: RenderDocumentOptions = {}
) {
  const documents = [
    { html: renderAppearanceOfCounselHtml(request, maskSensitive, options), lineHeight: "12pt" },
    { html: renderDocumentHtml(request, maskSensitive, { ...options, wrapDocument: false }), lineHeight: "14pt" },
    { html: renderWithdrawalOfCounselHtml(request, maskSensitive, options), lineHeight: "12pt" }
  ];

  if (options.wrapDocument === false) return documents.map((document) => document.html).join(renderDocumentBreak(false));

  return documents
    .map((document) => `<article style="max-width: 8.5in; margin: 0 auto; color: #000000; font-family: Times New Roman; font-size: 12pt; line-height: ${document.lineHeight};">${document.html}</article>`)
    .join(renderDocumentBreak(true));
}

export function renderAppearanceOfCounselHtml(
  request: QdroRequest,
  maskSensitive = false,
  options: RenderDocumentOptions = {}
) {
  const template = selectAppearanceTemplate(options.templates || documentTemplates);
  const rendered = inlineAppearanceDocumentStyles(renderTemplate(template, request, maskSensitive, options));
  const templateLabel = options.includeTemplateLabel === false
    ? ""
    : `<div style="margin: 0 0 12pt; color: #64748b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(template.name)} · configurable template v${template.version}</div>`;

  return `${templateLabel}${rendered}`;
}

function selectAppearanceTemplate(templates: DocumentTemplate[]) {
  return (
    templates.find((template) => template.id === "appearance-of-counsel-v1" && template.active) ||
    templates.find((template) => template.family === "Supplemental: Appearance of Counsel" && template.active) ||
    documentTemplates.find((template) => template.id === "appearance-of-counsel-v1" && template.active) ||
    documentTemplates.find((template) => template.family === "Supplemental: Appearance of Counsel" && template.active) ||
    documentTemplates[0]
  );
}

export function renderWithdrawalOfCounselHtml(
  request: QdroRequest,
  maskSensitive = false,
  options: RenderDocumentOptions = {}
) {
  const template = selectWithdrawalTemplate(options.templates || documentTemplates);
  const rendered = inlineWithdrawalDocumentStyles(renderTemplate(template, request, maskSensitive, options));
  const templateLabel = options.includeTemplateLabel === false
    ? ""
    : `<div style="margin: 0 0 12pt; color: #64748b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(template.name)} · configurable template v${template.version}</div>`;

  return `${templateLabel}${rendered}`;
}

function selectWithdrawalTemplate(templates: DocumentTemplate[]) {
  return (
    templates.find((template) => template.id === "withdrawal-of-counsel-v1" && template.active) ||
    templates.find((template) => template.family === "Supplemental: Withdrawal of Counsel" && template.active) ||
    documentTemplates.find((template) => template.id === "withdrawal-of-counsel-v1" && template.active) ||
    documentTemplates.find((template) => template.family === "Supplemental: Withdrawal of Counsel" && template.active) ||
    documentTemplates[0]
  );
}

function renderDocumentBreak(wrappedArticles: boolean) {
  const margin = wrappedArticles ? "24pt auto" : "24pt 0";
  return `<div style="break-after: page; page-break-after: always; height: 0; margin: ${margin};"></div>`;
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

function inlineAppearanceDocumentStyles(html: string) {
  const baseText = "font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;";
  const appearanceStyles = {
    section: `box-sizing: border-box; ${baseText}`,
    paragraph: `margin: 0 0 12pt; ${baseText}`,
    body: `margin: 0 0 12pt; ${baseText}`,
    serviceCertificate: `margin: 0 0 12pt; padding-top: 12pt; ${baseText}`,
    spacer: `margin: 0; ${baseText}`,
    captionTable: `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; ${baseText}`,
    captionCell: `border: 1px solid #000000; padding: 17pt 16pt; vertical-align: top; ${baseText}`,
    captionHeading: `border: 1px solid #000000; padding: 6pt 12pt; text-align: center; text-transform: uppercase; vertical-align: middle; ${baseText}`,
    captionLine: `margin: 0; ${baseText}`,
    captionBlank: `margin: 0; ${baseText}`,
    signatureTable: `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 12pt 0; ${baseText}`,
    signatureDate: `width: 50%; border: none; padding: 12pt 0 12pt 36pt; vertical-align: top; ${baseText}`,
    signatureCell: `width: 50%; border: none; padding: 12pt 0 0 36pt; vertical-align: top; ${baseText}`,
    signatureLine: `margin: 0; ${baseText}`
  };

  return html
    .replace(/<section class="supplemental-document">/g, `<section style="${appearanceStyles.section}">`)
    .replace(/<p class="attorney-block">/g, `<p style="${appearanceStyles.paragraph}">`)
    .replace(/<p class="counsel-line">/g, `<p style="${appearanceStyles.paragraph}">`)
    .replace(/<p class="caption-spacer">/g, `<p style="${appearanceStyles.spacer}">`)
    .replace(/<p class="body-text">/g, `<p style="${appearanceStyles.body}">`)
    .replace(/<p class="service-certificate">/g, `<p style="${appearanceStyles.serviceCertificate}">`)
    .replace(/<table class="court-caption">/g, `<table cellpadding="0" cellspacing="0" style="${appearanceStyles.captionTable}">`)
    .replace(/<table class="signature-row">/g, `<table cellpadding="0" cellspacing="0" style="${appearanceStyles.signatureTable}">`)
    .replace(/<div class="caption-line">/g, `<div style="${appearanceStyles.captionLine}">`)
    .replace(/<div class="caption-blank">/g, `<div style="${appearanceStyles.captionBlank}">`)
    .replace(/<td colspan="2" class="court-heading">/g, `<td colspan="2" style="${appearanceStyles.captionHeading}">`)
    .replace(/<td class="signature-date">/g, `<td style="${appearanceStyles.signatureDate}">`)
    .replace(/<td class="signature-name">/g, `<td style="${appearanceStyles.signatureCell}">`)
    .replace(/<div class="signature-line">/g, `<div style="${appearanceStyles.signatureLine}">`)
    .replace(/<td>/g, `<td style="${appearanceStyles.captionCell}">`);
}

function inlineWithdrawalDocumentStyles(html: string) {
  const baseText = "font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;";
  const withdrawalStyles = {
    section: `box-sizing: border-box; ${baseText}`,
    paragraph: `margin: 0 0 12pt; ${baseText}`,
    body: `margin: 0 0 12pt; ${baseText}`,
    serviceCertificate: `margin: 0 0 12pt; padding-top: 12pt; ${baseText}`,
    spacer: `margin: 0; ${baseText}`,
    captionTable: `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0; ${baseText}`,
    captionCell: `border: 1px solid #000000; padding: 17pt 16pt; vertical-align: top; ${baseText}`,
    captionHeading: `border: 1px solid #000000; padding: 6pt 12pt; text-align: center; text-transform: uppercase; vertical-align: middle; ${baseText}`,
    captionLine: `margin: 0; ${baseText}`,
    captionBlank: `margin: 0; ${baseText}`,
    signatureTable: `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 12pt 0; ${baseText}`,
    signatureDate: `width: 50%; border: none; padding: 12pt 0 12pt 36pt; vertical-align: top; ${baseText}`,
    signatureCell: `width: 50%; border: none; padding: 12pt 0 0 36pt; vertical-align: top; ${baseText}`,
    signatureLine: `margin: 0; ${baseText}`,
    serviceTable: `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 12pt; ${baseText}`,
    serviceCell: `width: 50%; border: none; padding: 0; vertical-align: top; ${baseText}`,
    serviceLine: `margin: 0; padding: 0; ${baseText}`
  };

  return html
    .replace(/<section class="supplemental-document">/g, `<section style="${withdrawalStyles.section}">`)
    .replace(/<p class="attorney-block">/g, `<p style="${withdrawalStyles.paragraph}">`)
    .replace(/<p class="counsel-line">/g, `<p style="${withdrawalStyles.paragraph}">`)
    .replace(/<p class="caption-spacer">/g, `<p style="${withdrawalStyles.spacer}">`)
    .replace(/<p class="body-text">/g, `<p style="${withdrawalStyles.body}">`)
    .replace(/<p class="service-certificate">/g, `<p style="${withdrawalStyles.serviceCertificate}">`)
    .replace(/<table class="court-caption">/g, `<table cellpadding="0" cellspacing="0" style="${withdrawalStyles.captionTable}">`)
    .replace(/<table class="signature-row">/g, `<table cellpadding="0" cellspacing="0" style="${withdrawalStyles.signatureTable}">`)
    .replace(/<table class="service-list">/g, `<table cellpadding="0" cellspacing="0" style="${withdrawalStyles.serviceTable}">`)
    .replace(/<div class="caption-line">/g, `<div style="${withdrawalStyles.captionLine}">`)
    .replace(/<div class="caption-blank">/g, `<div style="${withdrawalStyles.captionBlank}">`)
    .replace(/<td colspan="2" class="court-heading">/g, `<td colspan="2" style="${withdrawalStyles.captionHeading}">`)
    .replace(/<td class="signature-date">/g, `<td style="${withdrawalStyles.signatureDate}">`)
    .replace(/<td class="signature-name">/g, `<td style="${withdrawalStyles.signatureCell}">`)
    .replace(/<div class="signature-line">/g, `<div style="${withdrawalStyles.signatureLine}">`)
    .replace(/<td class="service-party">/g, `<td style="${withdrawalStyles.serviceCell}">`)
    .replace(/<td class="service-email">/g, `<td style="${withdrawalStyles.serviceCell}">`)
    .replace(/<div class="service-line">/g, `<div style="${withdrawalStyles.serviceLine}">`)
    .replace(/<td>/g, `<td style="${withdrawalStyles.captionCell}">`);
}

function inlineSupplementalDocumentStyles(html: string, options: { lineHeight?: string } = {}) {
  const lineHeight = options.lineHeight || "16pt";
  const paragraphStyle = `margin: 0 0 12pt; line-height: ${lineHeight}; font-family: Times New Roman; font-size: 12pt; color: #000000;`;
  const attorneyStyle = `margin: 0 0 12pt; line-height: ${lineHeight}; font-family: Times New Roman; font-size: 12pt; color: #000000;`;
  const counselStyle = `margin: 0 0 12pt; line-height: ${lineHeight}; font-family: Times New Roman; font-size: 12pt; color: #000000;`;
  const bodyStyle = `margin: 12pt 0 12pt; line-height: ${lineHeight}; font-family: Times New Roman; font-size: 12pt; color: #000000;`;
  const serviceStyle = `margin: 12pt 0 12pt; line-height: ${lineHeight}; font-family: Times New Roman; font-size: 12pt; color: #000000;`;
  const tableStyle = `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 0 22pt; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const cellStyle = `border: 1px solid #000000; padding: 17pt 16pt; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const headingCellStyle = `border: 1px solid #000000; padding: 6pt 12pt 6pt; text-align: center; text-transform: uppercase; vertical-align: middle; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const signatureTableStyle = `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 18pt 0 20pt; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const signatureCellStyle = `width: 50%; border: none; padding: 0 0 0 36pt; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const signatureRowStyle = `display: grid; grid-template-columns: 50% 50%; margin: 18pt 0 20pt; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const signatureColumnStyle = `padding: 0 0 0 36pt; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const serviceTableStyle = `width: 100%; border-collapse: collapse; table-layout: fixed; margin: 12pt 0 18pt; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;
  const serviceCellStyle = `width: 50%; border: none; padding: 0 0 8pt 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight}; color: #000000;`;

  return html
    .replace(/<section class="supplemental-document">/g, `<section style="box-sizing: border-box; color: #000000; font-family: Times New Roman; font-size: 12pt; line-height: ${lineHeight};">`)
    .replace(/<p class="attorney-block">/g, `<p style="${attorneyStyle}">`)
    .replace(/<p class="counsel-line">/g, `<p style="${counselStyle}">`)
    .replace(/<p class="body-text">/g, `<p style="${bodyStyle}">`)
    .replace(/<p class="service-certificate">/g, `<p style="${serviceStyle}">`)
    .replace(/<p>/g, `<p style="${paragraphStyle}">`)
    .replace(/<div class="signature-row">/g, `<div style="${signatureRowStyle}">`)
    .replace(/<div>/g, `<div style="${signatureColumnStyle}">`)
    .replace(/<table class="court-caption">/g, `<table cellpadding="0" cellspacing="0" style="${tableStyle}">`)
    .replace(/<table class="attorney-signature">/g, `<table cellpadding="0" cellspacing="0" style="${signatureTableStyle}">`)
    .replace(/<table class="service-list">/g, `<table cellpadding="0" cellspacing="0" style="${serviceTableStyle}">`)
    .replace(/<td colspan="2" class="court-heading">/g, `<td colspan="2" style="${headingCellStyle}">`)
    .replace(/<td>/g, `<td style="${cellStyle}">`)
    .replace(/<table cellpadding="0" cellspacing="0" style="${signatureTableStyle}">([\s\S]*?)<\/table>/g, (signatureTable) =>
      signatureTable.replace(new RegExp(cellStyle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), signatureCellStyle)
    )
    .replace(/<table cellpadding="0" cellspacing="0" style="${serviceTableStyle}">([\s\S]*?)<\/table>/g, (serviceTable) =>
      serviceTable.replace(new RegExp(cellStyle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), serviceCellStyle)
    );
}

function normalizeDocumentBodyHtml(html: string) {
  return html
    .replace(/color:\s*[^;"']+;?/gi, "color: #000000;")
    .replace(/<span([^>]*)>/gi, "<span$1 style=\"color: #000000;\">")
    .replace(/<(ul|ol)([^>]*)>/gi, '<$1$2 style="margin: 0 0 12pt 0.5in; color: #000000;">')
    .replace(/<li([^>]*)>/gi, '<li$1 style="margin: 0 0 6pt; color: #000000;">');
}


function stripLegacyDocumentShell(source: string) {
  const bodyStart = source.search(/<p class="indent">WHEREAS/i);
  const signatureStart = source.search(/<table class="signature-block"/i);
  if (bodyStart >= 0 && signatureStart > bodyStart) {
    return source.slice(bodyStart, signatureStart).trim();
  }
  return source;
}

function plainTextToTemplateHtml(source: string) {
  return source
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function extractMergeFields(source: string) {
  return Array.from(source.matchAll(/\{\{([^}]+)\}\}/g), (match) => match[1].trim()).filter(Boolean);
}

function humanizeMergeField(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bSsn\b/g, "SSN")
    .replace(/\bDob\b/g, "DOB");
}

function renderCommonDocumentShell(bodyHtml: string, data: ReturnType<typeof deriveDocumentData>, options: { highlightMergeFields?: boolean; wrapBody?: boolean } = {}) {
  const normalizedBody = normalizeDocumentBodyHtml(bodyHtml).trim();
  const bodySection = options.wrapBody === false
    ? normalizedBody
    : `<div class="document-body" style="margin-top: 18pt; margin-bottom: 18pt; color: #000000;">${normalizedBody}</div>`;
  const captionTableMargin = options.wrapBody === false ? " margin: 0 0 12pt;" : "";
  const afterCaptionSpacer = options.wrapBody === false
    ? `<p style="margin: 0 0 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000;">&nbsp;</p>`
    : "";
  const merge = (key: keyof typeof data) => renderMergedValue(String(data[key] ?? ""), options.highlightMergeFields, key);

  return `<p style="margin: 0 0 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000;">David J. Hunter (9015)<br />
    3915 Timpview Dr., Provo, UT 84604<br />
    801-473-4444 dave@utahmediations.com<br />
    <br />
    <em>Counsel for ${merge("counsel_for")}</em>
  </p>

  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: none; margin: 12pt 0; width: 100%; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
    <tbody>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase;">IN THE ${merge("district")} JUDICIAL DISTRICT COURT IN AND FOR ${merge("court_county")} COUNTY</td>
      </tr>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase;">STATE OF UTAH</td>
      </tr>
    </tbody>
  </table>

  <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; table-layout: fixed; border-left: none; border-right: none; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;${captionTableMargin}">
    <colgroup>
      <col style="width: 50%;" />
      <col style="width: 50%;" />
    </colgroup>
    <tbody>
      <tr>
        <td style="width: 50%; border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: 1px solid #000000; padding: 18pt 12pt 18pt 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">
          <p style="margin: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">In the Matter of the Marriage of</p>
          <p style="margin: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${merge("party1_name_upper")}, and${merge("party2_name_upper")}.</p>
        </td>
        <td style="width: 50%; border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none; padding: 18pt 0 18pt 14pt; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">
          <p style="margin: 0 0 18pt; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">${merge("order_title")}</p>
          <p style="margin: 0 0 18pt; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">Re: ${merge("entity_account_type")}<br />Case No. ${merge("case_number")}</p>
          <p style="margin: 0; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">Judge ${merge("judge_name")}</p>
        </td>
      </tr>
    </tbody>
  </table>${afterCaptionSpacer}${bodySection}<table class="signature-block" style="width: 100%; border-collapse: collapse; table-layout: fixed; border: none; margin-top: 24pt; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;">
    <colgroup>
      <col style="width: 50%;" />
      <col style="width: 50%;" />
    </colgroup>
    <tbody>
      <tr>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Approved as to form:_____________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; color: #000000;">________________________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; color: #000000;">${merge("participant_name")}, Participant,</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">(Signed Electronically)</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
      <tr>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Approved as to form: ____________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">&nbsp;</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border: none; padding: 0; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">________________________________</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${merge("alternate_payee_name")}, Alternate Payee,</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">(Signed Electronically)</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>

  <p class="court-footer" style="font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000; padding-top: 12pt; text-align: center;"><em>THIS IS THE SIGNED ORDER OF THE COURT WHEN SIGNED ELECTRONICALLY BY THE COURT ON THE FIRST PAGE OF THIS DOCUMENT</em></p>
`;
}

export function renderRtf(request: QdroRequest, maskSensitive = false) {
  const template = selectTemplate(request);
  const rendered = stripHtml(renderDocumentPackageHtml(request, maskSensitive, {
    includeTemplateLabel: false,
    wrapDocument: false,
    wrapBody: false
  }));
  const safe = rendered
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24\\b Appearance of Counsel, ${template.name}, and Withdrawal of Counsel\\b0\\par ${safe}}`;
}

function escapeHtml(valueToEscape: string) {
  return valueToEscape
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMergedValue(valueToRender: string, highlight = false, mergeTag = "") {
  const escapedValue = escapeHtml(valueToRender);
  if (!highlight) return escapedValue;
  const escapedMergeTag = escapeHtml(mergeTag);
  return `<mark class="merge-highlight" data-merge-tag="{{${escapedMergeTag}}}" style="background: #fef08a; color: #000000; padding: 0 2px;">${escapedValue || "&nbsp;"}</mark>`;
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
