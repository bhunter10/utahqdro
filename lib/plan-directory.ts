import { intakeSteps } from "./content";

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
