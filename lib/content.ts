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
    a: "A Qualified Domestic Relations Order is a court order that allows certain retirement benefits to be divided after divorce."
  },
  {
    q: "How much does it cost?",
    a: "The flat fee is $550 per QDRO for uncontested matters, including drafting, signatures, court submission, and sending the certified order to the plan administrator."
  },
  {
    q: "How long does the process take?",
    a: "Many QDROs take 4-10 weeks. UtahQDRO prepares and submits the order quickly, but courts and plan administrators can affect the timeline."
  },
  {
    q: "Do IRAs need a QDRO?",
    a: "Usually no. Some IRA administrators occasionally ask for one, so the intake flow asks you to confirm before proceeding."
  },
  {
    q: "Can I start if I do not know every answer?",
    a: "Yes. The new intake includes I don't know options so your request can be flagged for review instead of forcing a guess."
  }
];
