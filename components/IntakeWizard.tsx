"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { demoRequest, intakeSteps } from "@/lib/content";
import type { IntakeField, QdroRequest } from "@/lib/types";
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
  const [activeStep, setActiveStep] = useState(0);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<WizardData>({});
  const [savedAt, setSavedAt] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as { data?: WizardData; ready?: Record<string, boolean> };
      setData(parsed.data || {});
      setReady(parsed.ready || {});
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify({ data, ready }));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [data, ready]);

  const readyComplete = readinessChecks.every((check) => ready[check.id]);
  const visibleSteps = readyComplete ? intakeSteps : [];
  const readinessProgress = Object.values(ready).filter(Boolean).length / readinessChecks.length;
  const activeFormStep = intakeSteps[Math.min(activeStep, intakeSteps.length - 1)];
  const visibleActiveFields = activeFormStep?.fields.filter((field) => isFieldVisible(field, data)) || [];
  const completedActiveFields = visibleActiveFields.filter((field) => !field.required || Boolean(data[field.id])).length;
  const activeStepFieldProgress = visibleActiveFields.length ? completedActiveFields / visibleActiveFields.length : 0;
  const formPositionProgress =
    activeStep >= intakeSteps.length
      ? 1
      : (activeStep + activeStepFieldProgress) / (intakeSteps.length + 1);
  const progress = Math.min(
    100,
    Math.round(readyComplete ? 35 + formPositionProgress * 65 : readinessProgress * 35)
  );

  const request = useMemo<QdroRequest>(() => {
    const fields = { ...demoRequest.fields, ...data };
    return {
      ...demoRequest,
      id: "DRAFT",
      clientName: String(fields.party1_name || "New client"),
      clientEmail: String(fields.party1_email || ""),
      status: submitted ? "Payment Pending" : "Draft",
      paymentState: submitted ? "pending" : "unpaid",
      signatureState: "not_started",
      templateFamily: String(fields.plan_family || "Multi-template / other"),
      fields
    };
  }, [data, submitted]);

  function updateField(id: string, value: string | boolean) {
    setData((current) => ({ ...current, [id]: value }));
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
        <button className={`step-tab ${!readyComplete ? "active" : ""}`} type="button" onClick={() => setActiveStep(0)}>
          Readiness
        </button>
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
        {readyComplete && (
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
        {!readyComplete ? (
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
          </section>
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
  return (
    <section className="panel">
      <span className="status info">{step.title}</span>
      <h1 style={{ marginTop: 14 }}>{step.title}</h1>
      <p>{step.description}</p>
      <div className="field-grid">
        {step.fields.filter((field) => isFieldVisible(field, data)).map((field) => (
          <FieldControl key={field.id} field={field} value={data[field.id]} onChange={(value) => updateField(field.id, value)} />
        ))}
      </div>
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
