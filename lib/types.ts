export type RequestStatus =
  | "Draft"
  | "Submitted"
  | "Payment Pending"
  | "Paid"
  | "In Review"
  | "Needs Client Info"
  | "Draft Prepared"
  | "Sent for Signature"
  | "Filed with Court"
  | "Sent to Plan Administrator"
  | "Completed"
  | "Cancelled";

export type PaymentState = "unpaid" | "pending" | "paid" | "waived";
export type SignatureState = "not_started" | "sent" | "partially_signed" | "completed";
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "date"
  | "textarea"
  | "select"
  | "radio"
  | "currency"
  | "percent"
  | "file"
  | "checkbox";

export type ConditionalRule = {
  field: string;
  equals: string;
};

export type ConditionalHelp = {
  field: string;
  values: string[];
  text: string;
};

export type IntakeField = {
  id: string;
  label: string;
  type: FieldType;
  help?: string;
  helpWhen?: ConditionalHelp;
  placeholder?: string;
  required?: boolean;
  fullWidth?: boolean;
  constrained?: boolean;
  sensitive?: boolean;
  options?: string[];
  conditional?: ConditionalRule;
};

export type IntakeStep = {
  id: string;
  title: string;
  description: string;
  fields: IntakeField[];
};

export type RequestFile = {
  id: string;
  label: string;
  kind: "decree" | "statement" | "generated" | "signed" | "other";
  fileName: string;
  status: "missing" | "uploaded" | "generated" | "signed";
  url?: string;
  storagePath?: string;
};

export type RequestNote = {
  id: string;
  author: string;
  body: string;
  visibility: "internal" | "client";
  createdAt: string;
};

export type QdroRequest = {
  id: string;
  ownerUid: string;
  clientName: string;
  clientEmail: string;
  status: RequestStatus;
  paymentState: PaymentState;
  signatureState: SignatureState;
  templateFamily: string;
  fields: Record<string, string | boolean>;
  files: RequestFile[];
  notes: RequestNote[];
  createdAt: string;
  updatedAt: string;
};

export type DocumentTemplate = {
  id: string;
  name: string;
  family: string;
  version: number;
  description: string;
  format?: "plain" | "html";
  body?: string;
  htmlBody?: string;
  mergeFields?: string[];
  active: boolean;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: "client" | "admin";
};
