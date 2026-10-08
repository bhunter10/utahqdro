export const requestStatuses = [
  "Pending",
  "1 Approved Info",
  "1.1 Pmt Req to Party1",
  "1.2 Pmt Req to Party2",
  "2 Paid in Full",
  "3 Appearance Filed",
  "4 Drafted Dave to Review",
  "4.1 Ready for DocuSign",
  "5 Reviewed, Out for Client Sign",
  "6 Clients Signed, Filed in Court",
  "7 Judge Signed, Get Certified",
  "7.7 Send Cert to Admin E-MAIL",
  "7.8 Send Cert to Admin FAX",
  "7.9 Send Cert to Admin MAIL",
  "8 Got Cert, Sent to Plan Admin",
  "8.1 Email1 Client Status30",
  "8.2 Email1 Admin Status30",
  "8.3 Fax1 Admin Status30",
  "8.4 Mail1 Admin Status30",
  "8.5 Admin Status60",
  "8.6 Admin Status90",
  "8.7 Admin Status120+",
  "9 Administrator Approved",
  "9.1 Approved by Client",
  "10 Withdrawal and Closed File",
  "11 Archived"
] as const;

export type RequestStatus = (typeof requestStatuses)[number];

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
  planFamilies?: string[];
  accountTypes?: string[];
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
