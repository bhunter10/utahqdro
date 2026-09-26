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
    marriage_date: formatDisplayDate(value(request.fields, "marriage_date")),
    divorce_date: value(request.fields, "divorce_date"),
    order_title: `${amendedText ? `${amendedText} ` : ""}QUALIFIED DOMESTIC RELATIONS ORDER`,
    counsel_for: value(request.fields, "prepared_for") || request.clientName,
    party1_name_upper: party1Name.toUpperCase(),
    party2_name_upper: party2Name.toUpperCase(),
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
    valuation_date: formatDisplayDate(value(request.fields, "valuation_date")) || "the Date of Transfer",
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
  return (
    templates.find((template) => template.family === request.templateFamily && template.active) ||
    templates.find((template) => template.family === String(request.fields.plan_family) && template.active) ||
    templates[1] ||
    documentTemplates[1]
  );
}

export function renderTemplate(template: DocumentTemplate, request: QdroRequest, maskSensitive = false) {
  const data = deriveDocumentData(request, maskSensitive);
  const source = getEditableTemplateBody(template);
  return source.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const cleanKey = key.trim() as keyof typeof data;
    const merged = String(data[cleanKey] ?? "");
    return escapeHtml(merged);
  });
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
  options: { includeTemplateLabel?: boolean; templates?: DocumentTemplate[]; wrapDocument?: boolean; wrapBody?: boolean } = {}
) {
  const template = options.templates ? selectTemplateFromList(request, options.templates) : selectTemplate(request);
  const data = deriveDocumentData(request, maskSensitive);
  const rendered = inlineDocumentStyles(renderTemplate(template, request, maskSensitive));
  const templateLabel = options.includeTemplateLabel === false
    ? ""
    : `<div style="margin: 0 0 12pt; color: #64748b; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase;">${escapeHtml(template.name)} · configurable template v${template.version}</div>`;

  const documentBody = `${templateLabel}${renderCommonDocumentShell(rendered, data, { wrapBody: options.wrapBody !== false })}`;
  if (options.wrapDocument === false) return documentBody;

  return `<article style="max-width: 8.5in; margin: 0 auto; color: #000000; font-family: Times New Roman; font-size: 12pt; line-height: 14pt;">${documentBody}</article>`;
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

function renderCommonDocumentShell(bodyHtml: string, data: ReturnType<typeof deriveDocumentData>, options: { wrapBody?: boolean } = {}) {
  const normalizedBody = normalizeDocumentBodyHtml(bodyHtml).trim();
  const bodySection = options.wrapBody === false
    ? normalizedBody
    : `<div class="document-body" style="margin-top: 18pt; margin-bottom: 18pt; color: #000000;">${normalizedBody}</div>`;
  const captionTableMargin = options.wrapBody === false ? " margin: 0 0 12pt;" : "";
  const afterCaptionSpacer = options.wrapBody === false
    ? `<p style="margin: 0 0 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000;">&nbsp;</p>`
    : "";

  return `<p style="margin: 0 0 12pt; line-height: 12pt; font-family: Times New Roman; font-size: 12pt; color: #000000;">David J. Hunter (9015)<br />
    3915 Timpview Dr., Provo, UT 84604<br />
    801-473-4444 dave@utahmediations.com<br />
    <br />
    <em>Counsel for ${escapeHtml(data.counsel_for)}</em>
  </p>

  <table cellpadding="0" cellspacing="0" style="border-collapse: collapse; border: none; margin: 12pt 0; width: 100%; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
    <tbody>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase;">IN THE ${escapeHtml(data.district)} JUDICIAL DISTRICT COURT IN AND FOR ${escapeHtml(data.court_county)} COUNTY</td>
      </tr>
      <tr>
        <td style="border: none; padding: 0; text-align: center; text-transform: uppercase;">STATE OF UTAH</td>
      </tr>
    </tbody>
  </table>

  <table style="width: 100%; border-collapse: collapse; table-layout: fixed; border-left: none; border-right: none; font-family: Times New Roman; font-size: 12pt; line-height: 14pt; color: #000000;${captionTableMargin}">
    <colgroup>
      <col style="width: 50%;" />
      <col style="width: 50%;" />
    </colgroup>
    <tbody>
      <tr>
        <td style="border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: 1px solid #000000; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">In the Matter of the Marriage of</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${escapeHtml(data.party1_name_upper)}, and</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${escapeHtml(data.party2_name_upper)}.</td>
              </tr>
            </tbody>
          </table>
        </td>
        <td style="width: 50%; border-top: 1px solid #000000; border-bottom: 1px solid #000000; border-left: none; border-right: none; vertical-align: top; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
          <table cellpadding="0" cellspacing="0" style="width: 100%; padding-left: 12pt; border-collapse: collapse; border: none; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">
            <tbody>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${escapeHtml(data.order_title)}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Re: ${escapeHtml(data.entity_account_type)}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0 0 12pt; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Case No. ${escapeHtml(data.case_number)}</td>
              </tr>
              <tr>
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">Judge ${escapeHtml(data.judge_name)}</td>
              </tr>
            </tbody>
          </table>
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
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; color: #000000;">${escapeHtml(data.participant_name)}, Participant,</td>
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
                <td style="border: none; padding: 0; font-family: Times New Roman; font-size: 12pt; line-height: 12pt; color: #000000;">${escapeHtml(data.alternate_payee_name)}, Alternate Payee,</td>
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
  const rendered = stripHtml(renderTemplate(template, request, maskSensitive));
  const safe = rendered
    .replace(/\\/g, "\\\\")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/\n/g, "\\par\n");
  return `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Times New Roman;}}\\f0\\fs24\\b ${template.name}\\b0\\par ${safe}}`;
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
