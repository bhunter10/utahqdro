import { selectTemplateFromList } from "./template-matching";
import { documentTemplates, intakeSteps } from "./content";

const fields = intakeSteps.flatMap((step) => step.fields);
export const planEntities = [...new Set([...(fields.find((field) => field.id === "plan_family")?.options || []).filter((option) => option !== "Other"), "FERS", "CSRS", "Corning"])];
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
  if (entity === "Corning") {
    return {
      name: "Corning Incorporated Pension Plan",
      administrator: "Corning Incorporated Benefits Committee\nOne Riverfront Plaza MP-HQ-01-E24\nCorning, NY 14831\nPhone: 607-974-3966",
      notes: "Plan type: Defined Benefit Plan.\n\nCompany: Corning Incorporated (Corning Company)\nOne Riverfront Plaza\nCorning, NY 14831\nPhone: 607-974-3966"
    };
  }
  if (entity === "FERS" || entity === "CSRS") {
    return {
      name: entity === "FERS" ? "Federal Employees Retirement System (FERS)" : "Civil Service Retirement System (CSRS)",
      administrator: "U.S. Office of Personnel Management\nRetirement Services Program\nCourt Ordered Benefits Branch\nPost Office Box 17\nWashington, DC 20044-0017\nPhone: 1-888-767-6738 (ask to be transferred to the Court Ordered Benefits Branch)",
      notes: [
        "Part 1 — Court-ordered benefits (supplied reference notes): A court order may divide a CSRS or FERS benefit following divorce, legal separation, or annulment. The order must expressly direct OPM to pay a portion of monthly benefits, stated as a fixed amount, percentage, fraction, or formula readily calculable from the order and OPM’s files. The amount cannot exceed the retiree’s benefit after tax and insurance deductions.",
        "Payments from the retiree’s annuity end at the retiree’s death. Continuing payments require a survivor annuity elected by the retiree or provided by court order. An order may award all or part of a refund of employee contributions. To block a refund, the order must direct OPM not to pay it and also grant a survivor annuity or a portion of the retiree’s annuity to a legally separated or former spouse.",
        "Part 2 — Application: The former spouse must apply in writing; no special form is required. A representative may apply for an incompetent former spouse. Unless the order is already on file with OPM, include a court-certified copy of the order directing payment and other documents issued in the court action. Include certification by the former spouse or representative that the order remains in force and has not been amended, superseded, or set aside.",
        "Provide the employee’s or retiree’s full name, retirement claim number (if known), date of birth, and Social Security number, plus the applicant’s current address and the employee’s address if not retired or deceased. If payments terminate upon remarriage, include a statement that remarriage has not occurred. Mail the application materials to the Court Ordered Benefits Branch at the address above.",
        "Part 3 — Prior case experience: A FERS submission was rejected because a copy of the divorce decree was needed and the certified order needed a raised seal or gold seal. Confirm the required supporting documents and certification with OPM for the specific case."
      ].join("\n\n")
    };
  }
  if (entity === "Transamerica") {
    return {
      name: "Transamerica",
      administrator: "Transamerica\nQDRO Consultants\n3071 Pearl Road\nMedina, OH 44256\nFax: 1-330-722-2735",
      notes: ""
    };
  }
  if (entity === "Vanguard") {
    return {
      name: "Vanguard",
      administrator: "",
      notes: [
        "Note 1: Vanguard treats silence in the QDRO about interest, gains, and losses as including them. The default is to include gains and losses unless the order explicitly states that they shall not be included.",
        'Note 2: If an employee has been terminated, the rights of a terminated participant apply. Section 3, Paragraph 2: “Pursuant to the terms of the Plan, the Alternate Payee shall be entitled to all the rights and privileges that are afforded to terminated participants within the Plan.”'
      ].join("\n\n")
    };
  }
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
  const types = ["FERS", "CSRS", "Corning"].includes(entity) ? ["Pension"] : templates.some((template) => !template.accountTypes?.length)
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
