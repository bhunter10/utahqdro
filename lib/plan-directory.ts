import { selectTemplateFromList } from "./template-matching";
import { documentTemplates, intakeSteps } from "./content";

const fields = intakeSteps.flatMap((step) => step.fields);
export const planEntities = (fields.find((field) => field.id === "plan_family")?.options || []).filter((option) => option !== "Other");
export const planAccountTypes = (fields.find((field) => field.id === "account_type")?.options || []).filter((option) => option !== "Other");

export type PlanEntry = {
  id: string;
  name: string;
  administrator: string;
  entity: string;
  accountType: string;
  notes: string;
  active: boolean;
};

export function validatePlan(value: unknown): Omit<PlanEntry, "id"> | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const text = (key: string, max: number) => typeof data[key] === "string" && (data[key] as string).trim().length <= max ? (data[key] as string).trim() : null;
  const name = text("name", 300);
  const administrator = text("administrator", 300);
  const entity = text("entity", 100);
  const accountType = text("accountType", 100);
  const notes = text("notes", 3000);
  if (!name || !administrator || !entity || !accountType || notes === null || typeof data.active !== "boolean" || !planEntities.includes(entity) || !planAccountTypes.includes(accountType)) return null;
  return { name, administrator, entity, accountType, notes, active: data.active };
}

// Use existing offerings without assuming a provider is the legal administrator.
export const offeredPlans: PlanEntry[] = planEntities.flatMap((entity) => {
  const templates = documentTemplates.filter((template) => template.active && !template.family.startsWith("Supplemental:") && (template.planFamilies || [template.family]).includes(entity));
  const types = templates.some((template) => !template.accountTypes?.length)
    ? planAccountTypes
    : [...new Set(templates.flatMap((template) => template.accountTypes || []))];
  return (types.length ? types : [""]).map((accountType) => ({
    id: `offered-${entity.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${accountType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: "", administrator: "", entity, accountType, notes: "", active: true
  }));
});

export function mergeOfferedPlans(saved: PlanEntry[]): PlanEntry[] {
  return [...offeredPlans.filter((offered) => !saved.some((plan) => plan.entity === offered.entity && plan.accountType === offered.accountType)), ...saved];
}

export function matchedPlanTemplate(plan: Pick<PlanEntry, "entity" | "accountType">) {
  return selectTemplateFromList({ templateFamily: plan.entity, fields: { plan_family: plan.entity, account_type: plan.accountType } }, documentTemplates);
}
