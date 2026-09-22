"use client";

import { useMemo, useState } from "react";
import { documentTemplates, intakeSteps, sampleRequests, statuses } from "@/lib/content";
import type { IntakeField, QdroRequest, RequestStatus } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";
import { DocumentPreview } from "./DocumentPreview";

const derivedRequestFieldIds = new Set(["court_county", "district"]);

export function AdminClient() {
  const [requests, setRequests] = useState(sampleRequests);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"requests" | "fields" | "templates">("requests");

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return requests.filter(
      (request) =>
        request.clientName.toLowerCase().includes(normalized) ||
        request.clientEmail.toLowerCase().includes(normalized) ||
        request.id.toLowerCase().includes(normalized) ||
        request.status.toLowerCase().includes(normalized)
    );
  }, [query, requests]);

  const selected = requests.find((request) => request.id === selectedId) || null;

  function updateStatus(requestId: string, status: RequestStatus) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              updatedAt: new Date().toISOString()
            }
          : request
      )
    );
  }

  function updateField(requestId: string, field: string, value: string) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              fields: getUpdatedRequestFields(request.fields, field, value),
              updatedAt: new Date().toISOString()
            }
          : request
      )
    );
  }

  return (
    <main className="page">
      <section className="section admin-shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">Admin</div>
            <h1>Requests, fields, notes, statuses, and templates.</h1>
            <p className="lead">
              Work from the client list first, then open each request to review
              fields, notes, files, status, and the generated document preview.
            </p>
          </div>
          <div className="nav-actions">
            <button className={`button ${tab === "requests" ? "primary" : "secondary"}`} onClick={() => setTab("requests")} type="button">
              Requests
            </button>
            <button className={`button ${tab === "fields" ? "primary" : "secondary"}`} onClick={() => setTab("fields")} type="button">
              Fields
            </button>
            <button className={`button ${tab === "templates" ? "primary" : "secondary"}`} onClick={() => setTab("templates")} type="button">
              Templates
            </button>
          </div>
        </div>

        {tab === "requests" && (
          <section className="panel admin-request-panel">
            <div className="admin-list-head">
              <div>
                <span className="status info">{filtered.length} clients</span>
                <h2 style={{ marginTop: 12 }}>Client requests</h2>
              </div>
              <div className="field admin-search">
                <label htmlFor="request-search">Search requests</label>
                <input
                  className="input"
                  id="request-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, status, or request ID"
                />
              </div>
            </div>
            <div className="table-wrap" style={{ marginTop: 18 }}>
              <table className="admin-request-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Entity Type</th>
                    <th>Created</th>
                    <th>Updated</th>
                    <th>Edit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span className={`status ${request.status === "Needs Client Info" ? "warn" : "info"}`}>{request.status}</span>
                      </td>
                      <td>
                        <strong>{request.clientName}</strong>
                        <br />
                        <small>{request.clientEmail}</small>
                      </td>
                      <td>{getEntityType(request)}</td>
                      <td>{formatDate(request.createdAt)}</td>
                      <td>{formatDate(request.updatedAt)}</td>
                      <td>
                        <button className="button secondary compact-action" type="button" onClick={() => setSelectedId(request.id)}>
                          Edit
                        </button>
                      </td>
                      <td>{formatCurrency(getRequestTotal(request))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "fields" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <span className="status info">Form schema</span>
                <h2 style={{ marginTop: 12 }}>Admin-managed intake fields</h2>
                <p>Fields include labels, help text, required flags, sensitivity, options, and conditional display rules.</p>
              </div>
              <button className="button secondary" type="button">
                Add field
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Conditional</th>
                  </tr>
                </thead>
                <tbody>
                  {intakeSteps.flatMap((step) =>
                    step.fields.map((field) => (
                      <tr key={field.id}>
                        <td>{step.title}</td>
                        <td>{field.label}</td>
                        <td>{field.type}</td>
                        <td>{field.required ? "Yes" : "No"}</td>
                        <td>{field.conditional ? `${field.conditional.field} = ${field.conditional.equals}` : "None"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "templates" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <span className="status info">Document templates</span>
                <h2 style={{ marginTop: 12 }}>Versioned template library</h2>
                <p>Template families can be expanded from the legacy PHP files into merge-field based documents.</p>
              </div>
              <button className="button secondary" type="button">
                Add template version
              </button>
            </div>
            <div className="grid two">
              {documentTemplates.map((template) => (
                <article className="card template-config-card" key={template.id}>
                  <div className="toolbar" style={{ marginTop: 0 }}>
                    <span className="status">{template.active ? "active" : "inactive"}</span>
                    <span className="status info">{template.format || "plain"}</span>
                  </div>
                  <h3 style={{ marginTop: 12 }}>{template.name}</h3>
                  <p>{template.description}</p>
                  <small>Family: {template.family} · Version {template.version}</small>
                  <div className="template-merge-list">
                    {(template.mergeFields || []).map((field) => (
                      <code key={field}>{"{{"}{field}{"}}"}</code>
                    ))}
                  </div>
                  <div className="field" style={{ marginTop: 16 }}>
                    <label htmlFor={`${template.id}-body`}>Configurable template body</label>
                    <textarea
                      className="textarea template-body-editor"
                      id={`${template.id}-body`}
                      defaultValue={template.format === "html" ? template.htmlBody : template.body}
                    />
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "requests" && selected && (
          <RequestDetailModal
            request={selected}
            updateStatus={updateStatus}
            updateField={updateField}
            onClose={() => setSelectedId(null)}
          />
        )}
      </section>
    </main>
  );
}

function RequestDetailModal({
  request,
  updateStatus,
  updateField,
  onClose
}: {
  request: QdroRequest;
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span className="status info">{request.id}</span>
            <h2 id="request-modal-title" style={{ marginTop: 12 }}>{request.clientName}</h2>
            <p>
              {request.clientEmail} · {getEntityType(request)} · Total {formatCurrency(getRequestTotal(request))}
            </p>
          </div>
          <button className="button secondary" type="button" onClick={onClose} aria-label="Close request detail">
            Close
          </button>
        </div>
        <div className="request-modal-grid">
          <RequestEditor
            request={request}
            updateStatus={updateStatus}
            updateField={updateField}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
          />
          <div className="modal-stack">
            <RequestFilesAndNotes request={request} />
          </div>
          {showPreview && (
            <div className="request-preview-panel">
              <DocumentPreview request={request} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RequestEditor({
  request,
  updateStatus,
  updateField,
  showPreview,
  setShowPreview
}: {
  request: QdroRequest;
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  showPreview: boolean;
  setShowPreview: (showPreview: boolean) => void;
}) {
  const schemaFieldIds = new Set(intakeSteps.flatMap((step) => step.fields.map((field) => field.id)));
  const extraFields = Object.entries(request.fields).filter(
    ([field, value]) => !schemaFieldIds.has(field) && !derivedRequestFieldIds.has(field) && hasDisplayValue(value)
  );

  return (
    <section className="panel">
      <div className="field-grid one">
        <div className="field">
          <label htmlFor="status">Status</label>
          <select className="select" id="status" value={request.status} onChange={(event) => updateStatus(request.id, event.target.value as RequestStatus)}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-intake-sections">
          {intakeSteps.map((step) => {
            const visibleFields = step.fields.filter((field) => isAdminFieldVisible(field, request.fields));

            return (
              <section className="admin-intake-step" key={step.id}>
                <div>
                  <span className="status info">{step.title}</span>
                  <p>{step.description}</p>
                </div>
                <div className="field-grid">
                  {visibleFields.map((field) => (
                    <AdminFieldControl
                      field={field}
                      key={field.id}
                      request={request}
                      updateField={updateField}
                    />
                  ))}
                </div>
              </section>
            );
          })}
          {extraFields.length > 0 && (
            <section className="admin-intake-step">
              <div>
                <span className="status info">Additional saved fields</span>
                <p>Fields saved with this request that are not currently shown on the public request form.</p>
              </div>
              <div className="field-grid">
                {extraFields.map(([field, value]) => (
                  <div className="field" key={field}>
                    <label htmlFor={`admin-extra-${field}`}>{humanizeFieldId(field)}</label>
                    <input
                      className="input"
                      id={`admin-extra-${field}`}
                      value={String(value)}
                      onChange={(event) => updateField(request.id, field, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        <div className="field">
          <label htmlFor="client-note">Add client-visible note</label>
          <textarea className="textarea" id="client-note" placeholder="This demo UI shows where notes are added before saving to Firestore." />
        </div>
        <div className="toolbar">
          <button className="button secondary" type="button">
            Generate DOCX
          </button>
          <button className="button secondary" type="button">
            Send DocuSign
          </button>
          <button className="button secondary" type="button" onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Hide preview" : "Preview document"}
          </button>
          <button className="button danger" type="button">
            Delete request
          </button>
        </div>
      </div>
    </section>
  );
}

function AdminFieldControl({
  field,
  request,
  updateField
}: {
  field: IntakeField;
  request: QdroRequest;
  updateField: (id: string, field: string, value: string) => void;
}) {
  const inputId = `admin-field-${field.id}`;
  const value = request.fields[field.id];
  const stringValue = typeof value === "string" ? value : "";
  const common = {
    id: inputId,
    name: field.id,
    value: stringValue,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      updateField(request.id, field.id, event.target.value)
  };

  if (field.type === "radio") {
    return (
      <fieldset className="field">
        <legend>{field.label}</legend>
        {field.help && <small>{field.help}</small>}
        <div className="choice-row">
          {field.options?.map((option) => (
            <label className="choice" key={option}>
              <input
                type="radio"
                name={field.id}
                checked={value === option}
                onChange={() => updateField(request.id, field.id, option)}
              />
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
      <div className="field full-field">
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
          value={stringValue}
          onChange={(event) => updateField(request.id, field.id, event.target.value)}
          placeholder="No file selected"
        />
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

function RequestFilesAndNotes({ request }: { request: QdroRequest }) {
  return (
    <section className="panel">
      <div className="request-support-grid">
        <div>
          <h3>Files</h3>
          <div className="checklist">
            {request.files.map((file) => (
              <div className="mini-check" key={file.id}>
                <span className="icon">✓</span>
                <div>
                  <strong>{file.label}</strong>
                  <small>{file.fileName} · {file.status}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3>Notes</h3>
          <div className="checklist">
            {request.notes.map((note) => (
              <div className="mini-check" key={note.id}>
                <span className={`status ${note.visibility === "internal" ? "warn" : "info"}`}>{note.visibility}</span>
                <div>
                  <strong>{note.author}</strong>
                  <small>{formatDate(note.createdAt)}</small>
                  <p style={{ margin: "4px 0 0" }}>{note.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function isAdminFieldVisible(field: IntakeField, data: QdroRequest["fields"]) {
  if (!field.conditional) return true;
  return data[field.conditional.field] === field.conditional.equals;
}

function getUpdatedRequestFields(fields: QdroRequest["fields"], field: string, valueToSave: string) {
  if (field !== "court_location") return { ...fields, [field]: valueToSave };

  const court = findUtahCourt(valueToSave);
  return {
    ...fields,
    [field]: valueToSave,
    court_county: court?.county || "",
    district: court?.district || ""
  };
}

function hasDisplayValue(value: QdroRequest["fields"][string]) {
  return value !== "" && value !== undefined && value !== null;
}

function humanizeFieldId(field: string) {
  return field
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getEntityType(request: QdroRequest) {
  return String(request.fields.plan_family || request.templateFamily || "QDRO");
}

function getRequestTotal(request: QdroRequest) {
  return request.paymentState === "waived" ? 0 : 550;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
