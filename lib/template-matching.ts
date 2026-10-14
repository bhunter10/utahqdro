import { documentTemplates } from "./content";
import type { DocumentTemplate, QdroRequest } from "./types";

export function selectTemplate(request: QdroRequest): DocumentTemplate {
  return selectTemplateFromList(request, documentTemplates);
}

export function selectTemplateFromList(request: Pick<QdroRequest, "fields" | "templateFamily">, templates: DocumentTemplate[]): DocumentTemplate {
  const activeTemplates = templates.filter((template) => template.active && !isSupplementalTemplate(template));
  const fallbackTemplate =
    activeTemplates.find((template) => template.id === "general-v1") ||
    activeTemplates.find((template) => template.family === "Multi-template / other") ||
    documentTemplates.find((template) => template.id === "general-v1" && template.active && !isSupplementalTemplate(template)) ||
    documentTemplates.find((template) => template.family === "Multi-template / other" && template.active && !isSupplementalTemplate(template)) ||
    activeTemplates[0] ||
    documentTemplates.find((template) => template.active && !isSupplementalTemplate(template)) ||
    documentTemplates[0];
  const currentPlanFamily = String(request.fields.plan_family || "").trim();
  const requestedFamilies = [currentPlanFamily || request.templateFamily]
    .map((family) => family.trim())
    .filter(Boolean);
  const accountType = String(request.fields.account_type || "").trim();
  const familyMatches = activeTemplates
    .filter((template) => requestedFamilies.some((family) => templateMatchesFamily(template, family)))
    .sort((first, second) => Number(Boolean(second.accountTypes?.length)) - Number(Boolean(first.accountTypes?.length)));
  const accountTypeMatch = familyMatches.find((template) => templateMatchesAccountType(template, accountType));

  return (
    accountTypeMatch ||
    familyMatches.find((template) => !template.accountTypes?.length) ||
    familyMatches[0] ||
    fallbackTemplate
  );
}

function isSupplementalTemplate(template: DocumentTemplate) {
  return template.family.startsWith("Supplemental:");
}

function templateMatchesFamily(template: DocumentTemplate, family: string) {
  return template.family === family || Boolean(template.planFamilies?.includes(family));
}

function templateMatchesAccountType(template: DocumentTemplate, accountType: string) {
  if (!template.accountTypes?.length || !accountType) return false;
  const normalizedAccountType = normalizeTemplateMatchValue(accountType);
  return template.accountTypes.some((templateAccountType) => normalizedAccountType === normalizeTemplateMatchValue(templateAccountType));
}

function normalizeTemplateMatchValue(valueToNormalize: string) {
  return valueToNormalize.toLowerCase().replace(/[^a-z0-9]/g, "");
}

