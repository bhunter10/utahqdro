import { intakeSteps } from "./content";
import type { IntakeField } from "./types";

export type AiFieldConfidence = "found" | "review" | "missing";

export type AiExtractedField = {
  id: string;
  value: string;
  confidence: AiFieldConfidence;
  source: string;
  note: string;
};

export type AiExtractionResult = {
  fields: AiExtractedField[];
  summary: string;
};

export type AiUploadedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  storagePath: string;
  kind: "decree" | "statement" | "other";
};

export const aiIntakeFields = intakeSteps.flatMap((step) => step.fields);

export const aiIntakeFieldMap = new Map(aiIntakeFields.map((field) => [field.id, field]));

export function getRequiredAiFields(fields: Record<string, string | boolean>) {
  return aiIntakeFields.filter((field) => field.required && isAiFieldVisible(field, fields));
}

export function isAiFieldVisible(field: IntakeField, fields: Record<string, string | boolean>) {
  if (!field.conditional) return true;
  return fields[field.conditional.field] === field.conditional.equals;
}

export function getMissingRequiredAiFields(fields: Record<string, string | boolean>) {
  return getRequiredAiFields(fields).filter((field) => !hasAiFieldValue(fields[field.id]));
}

export function hasAiFieldValue(value: string | boolean | undefined) {
  return typeof value === "boolean" ? true : Boolean(String(value || "").trim());
}

export function normalizeAiFieldValue(field: IntakeField | undefined, value: string) {
  const trimmed = value.trim();
  if (!field || !trimmed) return trimmed;

  if (field.type === "percent") {
    const percentMatch = trimmed.match(/-?\d+(?:\.\d+)?/);
    return percentMatch ? percentMatch[0] : trimmed;
  }

  if (field.type === "currency") {
    const currencyMatch = trimmed.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
    return currencyMatch ? currencyMatch[0] : trimmed;
  }

  if (field.type === "date") {
    return normalizeDateValue(trimmed);
  }

  if ((field.type === "select" || field.type === "radio") && field.options?.length) {
    const exact = field.options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
    if (exact) return exact;

    const contains = field.options.find(
      (option) => option.toLowerCase().includes(trimmed.toLowerCase()) || trimmed.toLowerCase().includes(option.toLowerCase())
    );
    if (contains) return contains;
  }

  return trimmed;
}

function normalizeDateValue(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const numericMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numericMatch) {
    const [, first, second, yearValue] = numericMatch;
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return `${year}-${first.padStart(2, "0")}-${second.padStart(2, "0")}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return value;
}

export function getRequesterIdentity(fields: Record<string, string | boolean | undefined>, fallbackEmail = "") {
  if (fields.requester_role === "I am requesting this for someone else") {
    return {
      name: String(fields.requester_name || "Requester"),
      email: String(fields.requester_email || fallbackEmail)
    };
  }

  if (fields.requester_role === "I am the second name listed in the court case title") {
    return {
      name: String(fields.party2_name || "New client"),
      email: String(fields.party2_email || fallbackEmail)
    };
  }

  return {
    name: String(fields.party1_name || "New client"),
    email: String(fields.party1_email || fallbackEmail)
  };
}

export function getRequesterRoleHint(fields: Record<string, string | boolean | undefined>) {
  if (fields.requester_role === "I am the first name listed in the court case title") {
    return "Fill out your own information under Party 1.";
  }

  if (fields.requester_role === "I am the second name listed in the court case title") {
    return "Fill out your own information under Party 2.";
  }

  if (fields.requester_role === "I am requesting this for someone else") {
    return "Enter the court case parties exactly as they appear in the case title.";
  }

  return "";
}

export function buildAiExtractionPrompt() {
  const fieldGuide = aiIntakeFields
    .filter((field) => field.type !== "file")
    .map((field) => {
      const options = field.options?.length ? ` Options: ${field.options.join(" | ")}.` : "";
      const required = field.required ? " Required." : "";
      return `- ${field.id}: ${field.label}.${required}${options}`;
    })
    .join("\n");

  return `Extract QDRO intake answers from the uploaded divorce and retirement account documents.

Return only fields you can infer from the documents. Use these confidence labels:
- found: the document clearly states the answer.
- review: the answer is inferred, ambiguous, partially visible, or should be confirmed.
- missing: the field appears relevant but is not in the documents.

For each field, include a short source like "decree page 2" or "account statement page 1" when possible. If page numbers are unavailable, name the document. Do not invent values. If the documents include SSNs or dates of birth, extract them but mark review unless the value is perfectly legible.

If division_type is Percentage, also extract percent_award when the decree states the percentage. Return percent_award as the numeric percentage only, such as "50", and put reductions, offsets, or qualifiers in special_terms. If division_type is Fixed amount, also extract fixed_award when the decree states the dollar amount. Return fixed_award as the numeric dollar amount only. Do not return division_type alone when the award amount is visible.

Fields:
${fieldGuide}`;
}
