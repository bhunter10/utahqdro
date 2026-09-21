"use client";

import { useMemo, useState } from "react";
import { documentTemplates, intakeSteps, sampleRequests, statuses } from "@/lib/content";
import type { QdroRequest, RequestStatus } from "@/lib/types";
import { DocumentPreview } from "./DocumentPreview";

export function AdminClient() {
  const [requests, setRequests] = useState(sampleRequests);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(sampleRequests[0].id);
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

  const selected = requests.find((request) => request.id === selectedId) || requests[0];

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
              fields: { ...request.fields, [field]: value },
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
              This is the working admin surface for the new data model. It runs
              locally with demo data until Firestore credentials are connected.
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
          <div className="grid two">
            <section className="panel">
              <div className="field">
                <label htmlFor="request-search">Search requests</label>
                <input
                  className="input"
                  id="request-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by name, email, status, or request ID"
                />
              </div>
              <div className="table-wrap" style={{ marginTop: 18 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Request</th>
                      <th>Client</th>
                      <th>Status</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((request) => (
                      <tr key={request.id} onClick={() => setSelectedId(request.id)} style={{ cursor: "pointer" }}>
                        <td>{request.id}</td>
                        <td>
                          <strong>{request.clientName}</strong>
                          <br />
                          <small>{request.clientEmail}</small>
                        </td>
                        <td>{request.status}</td>
                        <td>{request.paymentState}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <RequestEditor request={selected} updateStatus={updateStatus} updateField={updateField} />
          </div>
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
                <article className="card" key={template.id}>
                  <span className="status">{template.active ? "active" : "inactive"}</span>
                  <h3 style={{ marginTop: 12 }}>{template.name}</h3>
                  <p>{template.description}</p>
                  <small>Family: {template.family} · Version {template.version}</small>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "requests" && <DocumentPreview request={selected} />}
      </section>
    </main>
  );
}

function RequestEditor({
  request,
  updateStatus,
  updateField
}: {
  request: QdroRequest;
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
}) {
  return (
    <section className="panel">
      <span className="status info">{request.id}</span>
      <h2 style={{ marginTop: 12 }}>{request.clientName}</h2>
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
        {["case_number", "formal_plan_name", "division_type", "special_terms"].map((field) => (
          <div className="field" key={field}>
            <label htmlFor={field}>{field.replaceAll("_", " ")}</label>
            <input
              className="input"
              id={field}
              value={String(request.fields[field] || "")}
              onChange={(event) => updateField(request.id, field, event.target.value)}
            />
          </div>
        ))}
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
          <button className="button danger" type="button">
            Delete request
          </button>
        </div>
      </div>
    </section>
  );
}
