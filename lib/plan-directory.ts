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

export function planSavePayload(draft: Omit<PlanEntry, "id">, editingId: string) {
  // Drafts can carry a lookup ID at runtime when copied from a selected entry.
  const { name, administrator, entity, accountType, notes, active } = draft;
  return { name, administrator, entity, accountType, notes, active, ...(editingId ? { id: editingId } : {}) };
}

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

// Supplied contact details for plans supported by the lookup.
function offeredPlanDetails(entity: string, accountType: string) {
  if (entity === "Fidelity") {
    return {
      name: "Fidelity",
      administrator: [
        "Fidelity Investments",
        "QDRO Administration Group",
        "P.O. Box 770001",
        "Cincinnati, OH 45277-0066",
        "Phone: 800-343-0860",
        "Fax: 877-665-4284",
        "Email: none"
      ].join("\n"),
      notes: [
        "Contact details updated June 30, 2025.",
        'When Paragraph 7 identifies the Valuation Date as the "Date of Transfer," Fidelity will understand that term to mean "Segregation Date," because "Date of Transfer" is not defined by the Plan’s QDRO Guidelines. The date of account segregation is the date the Alternate Payee’s award is segregated from the Participant’s account into a separate Plan account established in the Alternate Payee’s name.',
        "Fidelity QDRO Self Help Center: https://qdro.fidelity.com. This may help confirm formal plan names or where to send the certified QDRO. Double-check by phone with Fidelity if unsure."
      ].join("\n\n")
    };
  }
  if (entity === "Principal" && accountType === "401k plan") {
    return {
      name: "Principal",
      administrator: [
        "Principal Life Insurance Co.",
        "401k Plan Administrator",
        "PO Box 9394",
        "Des Moines, IA 50306-9394",
        "Phone: 800-986-3343",
        "Fax: 866-704-3481",
        "Email: expressemail@principal.com"
      ].join("\n"),
      notes: "Sometimes the certified QDRO goes to the employer as the plan administrator. Always call the employer or Principal to confirm the formal plan name, who the plan administrator is, and where to send the certified QDRO."
    };
  }
  if (entity !== "URS") return { name: "", administrator: "", notes: "" };
  const pension = accountType === "Pension";
  const savingsTypes = ["401k plan", "457 plan", "IRA Roth", "IRA Traditional"];
  if (!pension && !savingsTypes.includes(accountType)) return { name: "", administrator: "", notes: "" };
  return {
    name: pension ? "URS Pension Plans – Defined Benefit Plans" : "URS Savings Plans – Defined Contribution Plans",
    administrator: [
      "Utah Retirement Systems",
      pension ? "Defined Benefit Department" : "Defined Contribution Department",
      "P.O. Box 1590, Salt Lake City, Utah 84110-1590",
      `Phone ${pension ? "801-366-7770" : "801-366-7720"}`,
      "Fax 801-366-7733",
      "Email dcplans@urs.org"
    ].join("\n"),
    notes: pension ? "" : "Savings plans: 401k, 457, Roth IRA and Traditional IRA."
  };
}

// Use existing offerings without assuming a provider is the legal administrator.
export const offeredPlans: PlanEntry[] = planEntities.flatMap((entity) => {
  const templates = documentTemplates.filter((template) => template.active && !template.family.startsWith("Supplemental:") && (template.planFamilies || [template.family]).includes(entity));
  const types = templates.some((template) => !template.accountTypes?.length)
    ? planAccountTypes
    : [...new Set(templates.flatMap((template) => template.accountTypes || []))];
  return (types.length ? types : [""]).map((accountType) => ({
    id: `offered-${entity.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${accountType.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    ...offeredPlanDetails(entity, accountType), entity, accountType, active: true
  }));
});

const namedPlans: PlanEntry[] = [{
  id: "offered-tiaa-university-of-utah",
  name: "TIAA – University of Utah",
  administrator: "TIAA\nAttn: QDRO Unit\nP.O. Box 1259\nCharlotte, NC 28201",
  entity: "TIAA",
  accountType: "",
  notes: "",
  active: true
}];

export function mergeOfferedPlans(saved: PlanEntry[]): PlanEntry[] {
  saved = saved.map((plan) => plan.entity === "Fidelity"
    ? { ...plan, administrator: plan.administrator.split(/\r?\n/).filter((line) => line.trim() !== "If Fidelity is the administrator:").join("\n") }
    : plan);
  const named = namedPlans.filter((plan) => planEntities.includes(plan.entity) && !saved.some((entry) => entry.entity === plan.entity && entry.name === plan.name));
  return [...offeredPlans.filter((offered) => !saved.some((plan) => plan.entity === offered.entity && plan.accountType === offered.accountType)), ...named, ...saved];
}

export function matchedPlanTemplate(plan: Pick<PlanEntry, "entity" | "accountType">) {
  return selectTemplateFromList({ templateFamily: plan.entity, fields: { plan_family: plan.entity, account_type: plan.accountType } }, documentTemplates);
}
