import { fidelityHtmlTemplate, fidelityMergeFields } from "./templates/fidelity";
import type { DocumentTemplate, IntakeStep, QdroRequest, RequestStatus } from "./types";
import { utahCourtOptions } from "./utah-courts";

export const navigation = [
  { label: "About", href: "/about" },
  { label: "Retirement Plans", href: "/retirement-plans" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" }
];

export const statuses: RequestStatus[] = [
  "Draft",
  "Submitted",
  "Payment Pending",
  "Paid",
  "In Review",
  "Needs Client Info",
  "Draft Prepared",
  "Sent for Signature",
  "Filed with Court",
  "Sent to Plan Administrator",
  "Completed",
  "Cancelled"
];

export const intakeSteps: IntakeStep[] = [
  {
    id: "case",
    title: "Case details",
    description: "Start with the basics from your divorce case and signed decree.",
    fields: [
      {
        id: "case_number",
        label: "Court case number",
        type: "text",
        required: true,
        placeholder: "Example: 234400123"
      },
      {
        id: "court_location",
        label: "Which court was your case assigned to?",
        type: "select",
        required: true,
        options: ["I don't know", ...utahCourtOptions]
      },
      {
        id: "judge_name",
        label: "Judge who signed the decree",
        type: "text",
        required: true,
        placeholder: "Choose I don't know if you need us to confirm"
      },
      {
        id: "divorce_date",
        label: "Date the decree was signed",
        type: "date",
        required: true
      }
    ]
  },
  {
    id: "parties",
    title: "Parties",
    description: "Tell us who owns the retirement account and who will receive the divided share.",
    fields: [
      { id: "party1_name", label: "Party 1 full name", type: "text", required: true },
      { id: "party1_email", label: "Party 1 email", type: "email", required: true },
      { id: "party1_ssn", label: "Party 1 SSN", type: "text", required: true, sensitive: true, placeholder: "xxx-xx-xxxx" },
      { id: "party1_dob", label: "Party 1 date of birth", type: "date", required: true },
      { id: "party2_name", label: "Party 2 full name", type: "text", required: true },
      { id: "party2_email", label: "Party 2 email", type: "email", required: true },
      { id: "party2_ssn", label: "Party 2 SSN", type: "text", required: true, sensitive: true, placeholder: "xxx-xx-xxxx" },
      { id: "party2_dob", label: "Party 2 date of birth", type: "date", required: true },
      {
        id: "account_owner",
        label: "Who owns the retirement account?",
        type: "radio",
        required: true,
        options: ["Party 1", "Party 2"]
      }
    ]
  },
  {
    id: "plan",
    title: "Retirement plan",
    description: "Choose the plan family so we can use the right QDRO template and questions.",
    fields: [
      {
        id: "plan_family",
        label: "Plan or provider",
        type: "select",
        required: true,
        options: [
          "I don't know",
          "Fidelity",
          "Empower",
          "Principal 401k",
          "TSP",
          "URS",
          "DMBA",
          "IHC",
          "Multi-template / other"
        ]
      },
      {
        id: "formal_plan_name",
        label: "Formal plan name",
        type: "text",
        required: true,
        help: "Usually shown on the retirement account statement. If unsure, choose I don't know."
      },
      {
        id: "is_ira",
        label: "Are you trying to divide an IRA?",
        type: "radio",
        required: true,
        options: ["No", "Yes"]
      },
      {
        id: "ira_admin_confirmed",
        label: "Has the IRA administrator confirmed they require a QDRO?",
        type: "radio",
        options: ["No", "Yes"],
        conditional: { field: "is_ira", equals: "Yes" }
      }
    ]
  },
  {
    id: "division",
    title: "Division terms",
    description: "Use the exact terms from the divorce decree. If it is unclear, mark it for admin review.",
    fields: [
      {
        id: "division_type",
        label: "How is the account divided?",
        type: "radio",
        required: true,
        options: ["Percentage", "Fixed amount", "I don't know"]
      },
      {
        id: "percent_award",
        label: "Percentage awarded",
        type: "percent",
        conditional: { field: "division_type", equals: "Percentage" }
      },
      {
        id: "fixed_award",
        label: "Fixed dollar amount",
        type: "currency",
        conditional: { field: "division_type", equals: "Fixed amount" }
      },
      {
        id: "valuation_date",
        label: "Valuation date",
        type: "date",
        help: "Often the divorce date unless your decree says something different."
      },
      {
        id: "special_terms",
        label: "Special terms from the decree",
        type: "textarea",
        placeholder: "Loans, gains/losses, survivor benefits, or anything unusual"
      }
    ]
  },
  {
    id: "uploads",
    title: "Uploads",
    description: "Upload the documents needed before drafting can begin.",
    fields: [
      { id: "signed_decree", label: "Signed divorce decree", type: "file", required: true, help: "PDF preferred." },
      { id: "account_statement", label: "Retirement account statement", type: "file", required: true, help: "PDF or image accepted." },
      { id: "additional_documents", label: "Additional documents", type: "file" }
    ]
  }
];

export const documentTemplates: DocumentTemplate[] = [
  {
    id: "fidelity-v1",
    name: "Fidelity QDRO",
    family: "Fidelity",
    version: 1,
    active: true,
    description: "Defined contribution order for Fidelity-administered plans.",
    format: "html",
    htmlBody: fidelityHtmlTemplate,
    mergeFields: fidelityMergeFields
  },
  {
    id: "general-v1",
    name: "General QDRO",
    family: "Multi-template / other",
    version: 1,
    active: true,
    description: "General starter order for plan-specific admin review.",
    format: "plain",
    mergeFields: [
      "case_number",
      "formal_plan_name",
      "participant_name",
      "alternate_payee_name",
      "award_text",
      "valuation_date",
      "special_terms"
    ],
    body: `QUALIFIED DOMESTIC RELATIONS ORDER

Case No. {{case_number}}

Plan: {{formal_plan_name}}

Participant: {{participant_name}}
Alternate Payee: {{alternate_payee_name}}

Award: {{award_text}}
Valuation Date: {{valuation_date}}

Special Terms:
{{special_terms}}

This preview is prepared from the client intake and should be reviewed by UtahQDRO before filing or sending to the plan administrator.`
  }
];

export const demoRequest: QdroRequest = {
  id: "QDRO-2026-001",
  ownerUid: "demo-client",
  clientName: "Jordan Client",
  clientEmail: "client@example.com",
  status: "In Review",
  paymentState: "paid",
  signatureState: "sent",
  templateFamily: "Fidelity",
  createdAt: "2026-09-18T10:00:00.000Z",
  updatedAt: "2026-09-21T09:30:00.000Z",
  fields: {
    case_number: "234400123",
    court_location: "Provo",
    court_county: "Utah",
    district: "Fourth",
    judge_name: "Hon. Sample Judge",
    marriage_date: "2012-06-02",
    divorce_date: "2026-08-12",
    party1_name: "Jordan Client",
    party1_email: "client@example.com",
    party1_phone: "801-555-0100",
    party1_address: "1145 S 800 E, Orem, UT 84097",
    party1_ssn: "111-22-3333",
    party1_dob: "1983-04-15",
    party2_name: "Taylor Former",
    party2_email: "other@example.com",
    party2_phone: "801-555-0188",
    party2_address: "3915 Timpview Dr., Provo, UT 84604",
    party2_ssn: "444-55-6666",
    party2_dob: "1981-02-20",
    account_owner: "Party 1",
    plan_family: "Fidelity",
    entity_name: "Acme Industries",
    account_type: "401(k)",
    employer_name: "Acme Industries",
    formal_plan_name: "Acme Industries 401(k) Plan",
    market_adjustment: "Yes",
    is_ira: "No",
    division_type: "Percentage",
    percent_award: "50",
    valuation_date: "2026-08-12",
    special_terms: "Divide gains and losses from the valuation date through segregation."
  },
  files: [
    { id: "decree", label: "Signed divorce decree", kind: "decree", fileName: "decree.pdf", status: "uploaded" },
    { id: "statement", label: "Retirement statement", kind: "statement", fileName: "statement.pdf", status: "uploaded" },
    { id: "preview", label: "Draft QDRO preview", kind: "generated", fileName: "draft-preview.pdf", status: "generated" }
  ],
  notes: [
    {
      id: "n1",
      author: "UtahQDRO",
      visibility: "client",
      body: "We have the decree and account statement. The draft is being reviewed before signature routing.",
      createdAt: "2026-09-21T09:30:00.000Z"
    },
    {
      id: "n2",
      author: "Admin",
      visibility: "internal",
      body: "Confirm plan administrator name before final DocuSign envelope.",
      createdAt: "2026-09-21T09:35:00.000Z"
    }
  ]
};

export const sampleRequests: QdroRequest[] = [
  demoRequest,
  {
    ...demoRequest,
    id: "QDRO-2026-002",
    clientName: "Morgan Smith",
    clientEmail: "morgan@example.com",
    status: "Needs Client Info",
    paymentState: "pending",
    signatureState: "not_started",
    templateFamily: "URS",
    fields: {
      ...demoRequest.fields,
      party1_name: "Morgan Smith",
      party1_email: "morgan@example.com",
      plan_family: "URS",
      formal_plan_name: "Utah Retirement Systems 401(k) Plan",
      division_type: "I don't know"
    }
  },
  {
    ...demoRequest,
    id: "QDRO-2026-003",
    clientName: "Alex Rivera",
    clientEmail: "alex@example.com",
    status: "Sent for Signature",
    paymentState: "paid",
    signatureState: "partially_signed",
    templateFamily: "TSP",
    fields: {
      ...demoRequest.fields,
      party1_name: "Alex Rivera",
      party1_email: "alex@example.com",
      plan_family: "TSP",
      formal_plan_name: "Thrift Savings Plan",
      division_type: "Fixed amount",
      fixed_award: "24500"
    }
  }
];

export const faqs = [
  {
    q: "What is a QDRO?",
    a: "A Qualified Domestic Relations Order is a court order that lets certain retirement benefits be divided after divorce and assigned to a former spouse without triggering avoidable tax penalties."
  },
  {
    q: "Do I need a QDRO for my divorce?",
    a: "If your divorce divides a 401(k), pension, or another employer-sponsored retirement plan, you will usually need a QDRO so the plan can legally recognize and process the division."
  },
  {
    q: "Do IRAs need a QDRO to divide the funds?",
    a: "Often no. Many IRA custodians will divide an IRA with the divorce decree alone, but some may ask for a QDRO. Check with the financial institution first; if they require one, UtahQDRO can help."
  },
  {
    q: "How long does it take to get a QDRO?",
    a: "Timelines vary, but one to three months is common. UtahQDRO drafts and submits quickly, while court signature timing and plan administrator review can make some orders faster or slower."
  },
  {
    q: "How much does it cost to prepare a QDRO?",
    a: "The flat fee is $550 for each uncontested QDRO. That includes drafting, sending for signatures, submitting to the court, and sending the order to the plan administrator. Contested matters must be resolved by the parties, attorneys, or court first."
  },
  {
    q: "Can I prepare a QDRO myself?",
    a: "It is possible, but QDROs must satisfy federal law and the retirement plan's own requirements. Mistakes can delay the division or cause financial problems, so professional preparation is usually recommended."
  },
  {
    q: "What types of retirement plans require a QDRO?",
    a: "QDROs are commonly used for employer-sponsored plans such as 401(k)s, pensions, retirement annuities, TSP, FERS, and other qualified profit-sharing plans. IRAs usually follow different rules."
  },
  {
    q: "What happens if a QDRO is not filed?",
    a: "Without an approved QDRO, the retirement account generally stays under the participant's control and the former spouse may not receive the share awarded in the decree. That can create disputes later."
  },
  {
    q: "Do both parties need to agree on a QDRO?",
    a: "Usually yes. The parties, or their attorneys, typically need to agree on the QDRO terms before it is submitted to the court for approval."
  },
  {
    q: "Can a QDRO be modified after it's approved?",
    a: "Sometimes. A correction or amendment may be needed if the plan administrator rejects the order because something like the plan name, loan treatment, or division language needs adjustment. Court approval is usually required."
  },
  {
    q: "How do I get started with my QDRO?",
    a: "Start the online request, then UtahQDRO will review your divorce decree and retirement account statement so the QDRO can be prepared and submitted efficiently."
  }
];
