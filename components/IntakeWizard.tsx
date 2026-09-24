"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { demoRequest, intakeSteps } from "@/lib/content";
import { auth, db, hasFirebaseConfig } from "@/lib/firebase";
import type { IntakeField, QdroRequest } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";
import { SignaturePad } from "./SignaturePad";

const readinessChecks = [
  {
    id: "decreeSigned",
    label: "My divorce decree has been signed by the judge.",
    blocker: "A QDRO request cannot move forward until the decree is signed."
  },
  {
    id: "hasDecreePdf",
    label: "I have a PDF copy of the signed decree.",
    blocker: "You can usually get this from your lawyer or the court."
  },
  {
    id: "hasStatement",
    label: "I have a statement for the retirement account being divided.",
    blocker: "The account owner can usually download this from the plan website."
  },
  {
    id: "hasPersonalInfo",
    label: "I have both parties’ address, phone, email, SSN, date of birth, marriage date, and divorce date.",
    blocker: "You can still review the site, but drafting will need this information."
  },
  {
    id: "readyToPay",
    label: "I am ready to pay by credit card after reviewing the request.",
    blocker: "Payment is collected before the request becomes active."
  }
];

type WizardData = Record<string, string | boolean>;

const storageKey = "utah-qdro-intake";

export function IntakeWizard() {
  const [activeStep, setActiveStep] = useState(-2);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<WizardData>({});
  const [savedAt, setSavedAt] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [accountMode, setAccountMode] = useState<"create" | "sign-in">("create");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as { data?: WizardData; ready?: Record<string, boolean> };
      setData(parsed.data || {});
      setReady(parsed.ready || {});
      if (readinessChecks.every((check) => parsed.ready?.[check.id])) {
        setActiveStep(-1);
      }
    }
  }, []);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (currentUser) => {
      setClientUser(currentUser);
      if (currentUser?.email) {
        setAccountEmail(currentUser.email);
        setData((current) => current.party1_email ? current : { ...current, party1_email: currentUser.email || "" });
      }
    });
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify({ data, ready }));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [data, ready]);

  const readyComplete = readinessChecks.every((check) => ready[check.id]);
  const accountComplete = Boolean(clientUser);
  const visibleSteps = readyComplete && accountComplete ? intakeSteps : [];
  const readinessProgress = Object.values(ready).filter(Boolean).length / readinessChecks.length;
  const activeFormStep = activeStep >= 0 ? intakeSteps[Math.min(activeStep, intakeSteps.length - 1)] : undefined;
  const visibleActiveFields = activeFormStep?.fields.filter((field) => isFieldVisible(field, data)) || [];
  const completedActiveFields = visibleActiveFields.filter((field) => !field.required || Boolean(data[field.id])).length;
  const activeStepFieldProgress = visibleActiveFields.length ? completedActiveFields / visibleActiveFields.length : 0;
  const formPositionProgress =
    activeStep >= intakeSteps.length
      ? 1
      : (activeStep + activeStepFieldProgress) / (intakeSteps.length + 1);
  const progress = Math.min(
    100,
    Math.round(!readyComplete ? readinessProgress * 35 : !accountComplete ? 45 : 45 + formPositionProgress * 55)
  );

  const request = useMemo<QdroRequest>(() => {
    const fields = { ...demoRequest.fields, ...data };
    return {
      ...demoRequest,
      id: "DRAFT",
      clientName: String(fields.party1_name || "New client"),
      clientEmail: String(fields.party1_email || clientUser?.email || ""),
      status: submitted ? "Payment Pending" : "Draft",
      paymentState: submitted ? "pending" : "unpaid",
      signatureState: "not_started",
      templateFamily: String(fields.plan_family || "Multi-template / other"),
      fields
    };
  }, [clientUser?.email, data, submitted]);

  function updateField(id: string, value: string | boolean) {
    setData((current) => {
      if (id !== "court_location" || typeof value !== "string") {
        return { ...current, [id]: value };
      }

      const court = findUtahCourt(value);
      return {
        ...current,
        [id]: value,
        court_county: court?.county || "",
        district: court?.district || ""
      };
    });
  }

  async function beginCheckout() {
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id })
    });
    const payload = (await response.json()) as { url?: string; message?: string };
    setSubmitted(true);
    if (payload.url) {
      window.location.href = payload.url;
      return;
    }
    alert(payload.message || "Payment route is ready. Add Stripe credentials to enable live checkout.");
  }

  async function handleAccountSubmit() {
    setAccountMessage("");
    if (!hasFirebaseConfig || !auth || !db) {
      setAccountMessage("Firebase is not configured in this environment yet.");
      return;
    }

    try {
      setIsAccountSubmitting(true);
      if (accountMode === "create") {
        const credential = await createUserWithEmailAndPassword(auth, accountEmail, accountPassword);
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email: credential.user.email || accountEmail,
          displayName: credential.user.email || accountEmail,
          role: "client",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, accountEmail, accountPassword);
      }
      setData((current) => current.party1_email ? current : { ...current, party1_email: accountEmail });
      setActiveStep(0);
    } catch (error) {
      setAccountMessage(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    } finally {
      setIsAccountSubmitting(false);
    }
  }

  return (
    <div className="form-layout">
      <aside className="sidebar">
        <div style={{ padding: 10 }}>
          <strong>Request progress</strong>
          <p style={{ margin: "6px 0 12px" }}>{savedAt ? `Autosaved at ${savedAt}` : "Autosave ready"}</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button className={`step-tab ${activeStep === -2 ? "active" : ""}`} type="button" onClick={() => setActiveStep(-2)}>
          Readiness
        </button>
        {readyComplete && (
          <button className={`step-tab ${activeStep === -1 ? "active" : ""}`} type="button" onClick={() => setActiveStep(-1)}>
            Account setup
          </button>
        )}
        {visibleSteps.map((step, index) => (
          <button
            className={`step-tab ${readyComplete && activeStep === index ? "active" : ""}`}
            key={step.id}
            type="button"
            onClick={() => setActiveStep(index)}
          >
            {step.title}
          </button>
        ))}
        {readyComplete && accountComplete && (
          <button
            className={`step-tab ${activeStep === intakeSteps.length ? "active" : ""}`}
            type="button"
            onClick={() => setActiveStep(intakeSteps.length)}
          >
          Review, sign & pay
          </button>
        )}
      </aside>

      <div className="wizard">
        {activeStep === -2 ? (
          <section className="panel">
            <span className="status warn">Readiness checklist</span>
            <h1 style={{ marginTop: 14 }}>Before we start, confirm you have what we need.</h1>
            <p>
              The checklist keeps clients from paying before the request can
              actually move forward.
            </p>
            <div className="checklist">
              {readinessChecks.map((check) => (
                <label className="choice" key={check.id}>
                  <input
                    type="checkbox"
                    checked={Boolean(ready[check.id])}
                    onChange={(event) => setReady((current) => ({ ...current, [check.id]: event.target.checked }))}
                  />
                  <span>
                    <strong>{check.label}</strong>
                    {!ready[check.id] && <small style={{ display: "block", color: "var(--muted)" }}>{check.blocker}</small>}
                  </span>
                </label>
              ))}
            </div>
            <div className="toolbar">
              <button className="button primary" type="button" disabled={!readyComplete} onClick={() => setActiveStep(-1)}>
                Continue to account setup
              </button>
            </div>
            {!readyComplete && <p>Check each item when you are ready to begin the request.</p>}
          </section>
        ) : activeStep === -1 || !accountComplete ? (
          <AccountSetupStep
            accountEmail={accountEmail}
            accountMessage={accountMessage}
            accountMode={accountMode}
            accountPassword={accountPassword}
            clientUser={clientUser}
            isAccountSubmitting={isAccountSubmitting}
            onBack={() => setActiveStep(-2)}
            onContinue={() => setActiveStep(0)}
            onSubmit={handleAccountSubmit}
            setAccountEmail={setAccountEmail}
            setAccountMessage={setAccountMessage}
            setAccountMode={setAccountMode}
            setAccountPassword={setAccountPassword}
          />
        ) : activeStep < intakeSteps.length ? (
          <WizardStep
            step={intakeSteps[activeStep]}
            data={data}
            updateField={updateField}
            onBack={() => setActiveStep((step) => Math.max(0, step - 1))}
            onNext={() => setActiveStep((step) => Math.min(intakeSteps.length, step + 1))}
          />
        ) : (
          <>
            <section className="panel">
              <span className="status info">Review</span>
              <h1 style={{ marginTop: 14 }}>Review, sign, then pay.</h1>
              <p>
                Confirm the intake is ready, sign the request authorization, and
                continue to payment. The generated PDF preview is reviewed in the
                admin portal before final processing.
              </p>
              <div className="grid three" style={{ marginTop: 18 }}>
                <article className="card">
                  <h3>Payment</h3>
                  <p>$550 flat fee per QDRO. Stripe Checkout is used when credentials are configured.</p>
                </article>
                <article className="card">
                  <h3>Client signature</h3>
                  <p>Sign this request directly on the page without needing DocuSign.</p>
                </article>
                <article className="card">
                  <h3>Status</h3>
                  <p>Clients can return to the portal to see notes, files, and progress.</p>
                </article>
              </div>
              <div className="field" style={{ marginTop: 22 }}>
                <label>Client signature</label>
                <small>
                  I authorize UtahQDRO to use the information submitted in this
                  request to prepare the QDRO paperwork for admin review.
                </small>
                <SignaturePad
                  value={typeof data.client_signature === "string" ? data.client_signature : ""}
                  onChange={(signature) => updateField("client_signature", signature)}
                />
              </div>
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => setActiveStep(intakeSteps.length - 1)}>
                  Back
                </button>
                <button
                  className="button primary"
                  type="button"
                  onClick={beginCheckout}
                  disabled={!data.client_signature}
                >
                  Continue to payment
                </button>
              </div>
              {!data.client_signature && <p>Please sign before continuing to payment.</p>}
              {submitted && (
                <p>
                  Request saved as <Link className="muted-link" href="/portal">Payment Pending in the client portal</Link>.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function AccountSetupStep({
  accountEmail,
  accountMessage,
  accountMode,
  accountPassword,
  clientUser,
  isAccountSubmitting,
  onBack,
  onContinue,
  onSubmit,
  setAccountEmail,
  setAccountMessage,
  setAccountMode,
  setAccountPassword
}: {
  accountEmail: string;
  accountMessage: string;
  accountMode: "create" | "sign-in";
  accountPassword: string;
  clientUser: User | null;
  isAccountSubmitting: boolean;
  onBack: () => void;
  onContinue: () => void;
  onSubmit: () => void;
  setAccountEmail: (value: string) => void;
  setAccountMessage: (value: string) => void;
  setAccountMode: (value: "create" | "sign-in") => void;
  setAccountPassword: (value: string) => void;
}) {
  if (clientUser) {
    return (
      <section className="panel">
        <span className="status info">Account ready</span>
        <h1 style={{ marginTop: 14 }}>Your request will be saved to your account.</h1>
        <p>
          Signed in as {clientUser.email}. Continue the QDRO request and your
          progress will stay connected to this account.
        </p>
        <div className="toolbar">
          <button className="button secondary" type="button" onClick={onBack}>
            Back
          </button>
          <button className="button primary" type="button" onClick={onContinue}>
            Continue QDRO request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel account-setup-panel">
      <span className="status info">{accountMode === "create" ? "Create account" : "Sign in"}</span>
      <h1 style={{ marginTop: 14 }}>Set up your account before continuing.</h1>
      <p>
        This keeps your QDRO request, uploads, signature, payment status, and
        future updates tied to one secure place.
      </p>
      <div className="field-grid one">
        <div className="field">
          <label htmlFor="intake-account-email">Email</label>
          <input
            className="input"
            id="intake-account-email"
            type="email"
            value={accountEmail}
            onChange={(event) => setAccountEmail(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="intake-account-password">Password</label>
          <input
            className="input"
            id="intake-account-password"
            type="password"
            value={accountPassword}
            onChange={(event) => setAccountPassword(event.target.value)}
          />
        </div>
      </div>
      {accountMessage && <p style={{ color: "var(--danger)" }}>{accountMessage}</p>}
      <div className="toolbar">
        <button className="button secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button primary" type="button" onClick={onSubmit} disabled={isAccountSubmitting || !accountEmail || !accountPassword}>
          {isAccountSubmitting ? "Working..." : accountMode === "create" ? "Create account and continue" : "Sign in and continue"}
        </button>
      </div>
      <p>
        {accountMode === "create" ? "Already have an account?" : "Need an account?"}{" "}
        <button
          className="button ghost"
          type="button"
          onClick={() => {
            setAccountMode(accountMode === "create" ? "sign-in" : "create");
            setAccountMessage("");
          }}
        >
          {accountMode === "create" ? "Sign in" : "Create account"}
        </button>
      </p>
    </section>
  );
}

function WizardStep({
  step,
  data,
  updateField,
  onBack,
  onNext
}: {
  step: (typeof intakeSteps)[number];
  data: WizardData;
  updateField: (id: string, value: string | boolean) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const visibleFields = step.fields.filter((field) => isFieldVisible(field, data));

  return (
    <section className="panel">
      <span className="status info">{step.title}</span>
      <h1 style={{ marginTop: 14 }}>{step.title}</h1>
      <p>{step.description}</p>
      {step.id === "parties" ? (
        <WizardPartyFieldGroups fields={visibleFields} data={data} updateField={updateField} />
      ) : (
        <div className="field-grid">
          {visibleFields.map((field) => (
            <FieldControl key={field.id} field={field} value={data[field.id]} onChange={(value) => updateField(field.id, value)} />
          ))}
        </div>
      )}
      {data.is_ira === "Yes" && data.ira_admin_confirmed !== "Yes" && (
        <div className="card" style={{ marginTop: 18, borderColor: "#f59e0b" }}>
          <h3>IRA warning</h3>
          <p>
            IRAs usually do not require a QDRO. Confirm with the administrator
            before paying for a QDRO request.
          </p>
        </div>
      )}
      <div className="toolbar">
        <button className="button secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button primary" type="button" onClick={onNext}>
          Continue
        </button>
      </div>
    </section>
  );
}

function WizardPartyFieldGroups({
  fields,
  data,
  updateField
}: {
  fields: IntakeField[];
  data: WizardData;
  updateField: (id: string, value: string | boolean) => void;
}) {
  const party1Fields = fields.filter((field) => field.id.startsWith("party1_"));
  const party2Fields = fields.filter((field) => field.id.startsWith("party2_"));
  const remainingFields = fields.filter((field) => !field.id.startsWith("party1_") && !field.id.startsWith("party2_"));

  return (
    <div className="party-field-groups">
      <section className="party-field-group">
        <div className="party-field-group-head">
          <span className="status info">Party 1</span>
        </div>
        <div className="field-grid">
          {party1Fields.map((field) => (
            <FieldControl key={field.id} field={field} value={data[field.id]} onChange={(value) => updateField(field.id, value)} />
          ))}
        </div>
      </section>
      <section className="party-field-group party-field-group-secondary">
        <div className="party-field-group-head">
          <span className="status info">Party 2</span>
        </div>
        <div className="field-grid">
          {party2Fields.map((field) => (
            <FieldControl key={field.id} field={field} value={data[field.id]} onChange={(value) => updateField(field.id, value)} />
          ))}
        </div>
      </section>
      {remainingFields.length > 0 && (
        <div className="field-grid">
          {remainingFields.map((field) => (
            <FieldControl key={field.id} field={field} value={data[field.id]} onChange={(value) => updateField(field.id, value)} />
          ))}
        </div>
      )}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange
}: {
  field: IntakeField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  const inputId = `field-${field.id}`;
  const common = {
    id: inputId,
    name: field.id,
    value: typeof value === "string" ? value : "",
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(event.target.value)
  };

  if (field.type === "radio") {
    return (
      <fieldset className="field">
        <legend>{field.label}</legend>
        {field.help && <small>{field.help}</small>}
        <div className="choice-row">
          {field.options?.map((option) => (
            <label className="choice" key={option}>
              <input type="radio" name={field.id} checked={value === option} onChange={() => onChange(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.type === "select") {
    return (
      <div className="field">
        <label htmlFor={inputId}>{field.label}</label>
        {field.help && <small>{field.help}</small>}
        <select className="select" {...common}>
          <option value="">Choose one</option>
          {field.options?.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="field" style={{ gridColumn: "1 / -1" }}>
        <label htmlFor={inputId}>{field.label}</label>
        {field.help && <small>{field.help}</small>}
        <textarea className="textarea" {...common} placeholder={field.placeholder} />
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <div className="field">
        <label htmlFor={inputId}>{field.label}</label>
        {field.help && <small>{field.help}</small>}
        <input
          className="input"
          id={inputId}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={(event) => onChange(event.target.files?.[0]?.name || "")}
        />
        {value && <small>Selected: {String(value)}</small>}
      </div>
    );
  }

  const type = field.type === "email" ? "email" : field.type === "date" ? "date" : field.type === "phone" ? "tel" : "text";

  return (
    <div className="field">
      <label htmlFor={inputId}>{field.label}</label>
      {field.help && <small>{field.help}</small>}
      <input className="input" {...common} type={type} placeholder={field.placeholder} />
    </div>
  );
}

function isFieldVisible(field: IntakeField, data: WizardData) {
  if (!field.conditional) return true;
  return data[field.conditional.field] === field.conditional.equals;
}
