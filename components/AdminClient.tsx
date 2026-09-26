"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeAiFieldValue } from "@/lib/ai-intake";
import { intakeSteps, sampleRequests, statuses } from "@/lib/content";
import { getEditableTemplateBody } from "@/lib/document-engine";
import { formatPhoneInput, formatSsnInput, isSsnFieldId } from "@/lib/field-format";
import { auth, missingFirebaseConfig } from "@/lib/firebase";
import type { DocumentTemplate, IntakeField, QdroRequest, RequestFile, RequestStatus } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";
import { DocumentPreview } from "./DocumentPreview";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

const derivedRequestFieldIds = new Set(["court_county", "district"]);
type AdminTab = "requests" | "fields" | "templates";
type AdminAccessState = "checking" | "allowed" | "denied";

export function AdminClient({ initialTab = "requests", mode = "workspace" }: { initialTab?: AdminTab; mode?: "login" | "workspace" }) {
  const router = useRouter();
  const isLoginScreen = mode === "login";
  const [requests, setRequests] = useState(sampleRequests);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthMessage, setAdminAuthMessage] = useState("");
  const [isAdminAuthSubmitting, setIsAdminAuthSubmitting] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccessState>("checking");
  const [templateStatus, setTemplateStatus] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<AdminTab>(initialTab);

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

  useEffect(() => {
    if (!auth) {
      setTemplateStatus(`Firebase is not configured. Missing: ${missingFirebaseConfig.join(", ")}.`);
      return;
    }

    return onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      if (user) {
        if (isLoginScreen) {
          router.replace("/admin/requests");
          return;
        }
        setAdminAccess("checking");
        void loadRequests().then((hasAccess) => {
          if (!hasAccess) {
            setAdminAccess("denied");
            return;
          }
          setAdminAccess("allowed");
          void loadTemplates();
        });
      } else {
        setAdminAccess("checking");
        setTemplateStatus("Sign in as an admin to load and save database templates.");
        if (!isLoginScreen) {
          router.replace("/admin");
        }
      }
    });
  }, [isLoginScreen, router]);

  async function handleAdminSignIn() {
    setAdminAuthMessage("");
    if (!auth) {
      setAdminAuthMessage(`Firebase is not configured. Missing: ${missingFirebaseConfig.join(", ")}.`);
      return;
    }

    try {
      setIsAdminAuthSubmitting(true);
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      setAdminPassword("");
      setAdminAuthMessage("Signed in. Opening admin requests...");
      router.replace("/admin/requests");
    } catch (error) {
      setAdminAuthMessage(getFirebaseAuthMessage(error));
    } finally {
      setIsAdminAuthSubmitting(false);
    }
  }

  async function handleAdminSignOut() {
    if (!auth) return;
    await signOut(auth);
    setAdminAuthMessage("Signed out.");
    router.replace("/admin");
  }

  async function getAdminToken() {
    const user = auth?.currentUser;
    if (!user) return "";
    return user.getIdToken();
  }

  async function loadTemplates() {
    setTemplates([]);
    const token = await getAdminToken();
    if (!token) {
      setTemplateStatus("Sign in as an admin to load and save database templates.");
      return;
    }

    try {
      const response = await fetch("/api/admin/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = (await response.json()) as { message?: string; templates?: DocumentTemplate[] };
      if (!response.ok) {
        setTemplateStatus(result.message || "Could not load database templates.");
        return;
      }
      setTemplates(result.templates || []);
      setTemplateStatus(result.message || "Database templates loaded.");
    } catch {
      setTemplateStatus("Could not load database templates.");
    }
  }

  async function loadRequests() {
    const token = await getAdminToken();
    if (!token) return false;

    try {
      const response = await fetch("/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = (await response.json()) as { message?: string; requests?: QdroRequest[] };
      if (!response.ok) {
        setTemplateStatus(result.message || "Could not load database requests.");
        return false;
      }
      if (!result.requests?.length) {
        setTemplateStatus(result.message || "No database requests found yet. Showing demo requests.");
        return true;
      }

      setRequests(mergeRequests(result.requests, sampleRequests));
      setTemplateStatus(`Loaded ${result.requests.length} database request${result.requests.length === 1 ? "" : "s"}.`);
      return true;
    } catch (error) {
      setTemplateStatus(error instanceof Error ? error.message : "Could not load database requests.");
      return false;
    }
  }

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

  function updateInternalNotes(requestId: string, body: string) {
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              notes: getUpdatedInternalNotes(request.notes, body),
              updatedAt: new Date().toISOString()
            }
          : request
      )
    );
  }

  async function deleteRequest(requestId: string) {
    const token = await getAdminToken();
    if (!token) {
      setTemplateStatus("Sign in as an admin to delete requests.");
      return false;
    }

    try {
      const response = await fetch("/api/admin/requests", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requestId })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setTemplateStatus(result.message || "Could not delete request.");
        return false;
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      setSelectedId(null);
      setTemplateStatus(result.message || "Request deleted.");
      return true;
    } catch (error) {
      setTemplateStatus(error instanceof Error ? error.message : "Could not delete request.");
      return false;
    }
  }

  async function openUploadedFile(requestId: string, file: RequestFile) {
    const fileWindow = window.open("", "_blank", "noopener,noreferrer");
    writeFileWindowMessage(fileWindow, "Opening uploaded file...");

    const token = await getAdminToken();
    if (!token) {
      setTemplateStatus("Sign in as an admin to open uploaded files.");
      writeFileWindowMessage(fileWindow, "Sign in as an admin to open uploaded files.");
      return;
    }

    try {
      const params = new URLSearchParams({ requestId, fileId: file.id });
      const response = await fetch(`/api/admin/request-file?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = (await response.json()) as { message?: string; url?: string };
      if (!response.ok || !result.url) {
        setTemplateStatus(result.message || "Could not open uploaded file.");
        writeFileWindowMessage(fileWindow, result.message || "Could not open uploaded file.");
        return;
      }

      if (fileWindow) {
        fileWindow.location.href = result.url;
      } else {
        window.location.href = result.url;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open uploaded file.";
      setTemplateStatus(message);
      writeFileWindowMessage(fileWindow, message);
    }
  }

  function navigateToTab(nextTab: AdminTab) {
    setTab(nextTab);
    router.push(`/admin/${nextTab}`);
  }

  async function saveTemplateChanges(templateId: string, htmlBody: string) {
    const token = await getAdminToken();
    if (!token) {
      throw new Error("Sign in as an admin to save database templates.");
    }

    const response = await fetch("/api/admin/templates", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ templateId, htmlBody })
    });
    const result = (await response.json()) as { message?: string; template?: DocumentTemplate };
    if (!response.ok || !result.template) {
      throw new Error(result.message || "Could not save template changes.");
    }

    setTemplates((currentTemplates) =>
      currentTemplates.map((template) => (template.id === templateId ? result.template as DocumentTemplate : template))
    );
    setTemplateStatus(result.message || "Template changes saved.");
  }

  return (
    <>
      {!isLoginScreen && (
        <section className="admin-auth-panel">
          <div>
            <span className={`status ${adminAccess === "allowed" ? "info" : "warn"}`}>
              {adminAccess === "allowed" ? "Admin signed in" : adminAccess === "denied" ? "Access denied" : "Checking admin"}
            </span>
            <p>{adminUser ? `Signed in as ${adminUser.email || adminUser.uid}.` : "Checking admin access..."}</p>
          </div>
          {adminUser && (
            <div className="toolbar" style={{ marginTop: 0 }}>
              <button className="button secondary" type="button" onClick={() => void handleAdminSignOut()}>
                Sign out
              </button>
            </div>
          )}
        </section>
      )}

      {isLoginScreen ? (
        <main className="admin-login-page">
          <section className="admin-login-screen">
            <div className="admin-login-copy">
              <div className="eyebrow">Admin</div>
              <h1>Admin login</h1>
              <p className="lead">Sign in to manage client requests, statuses, internal notes, and document templates.</p>
            </div>
            <section className="panel admin-login-card" aria-labelledby="admin-login-title">
              <div>
                <span className="status info">Secure access</span>
                <h2 id="admin-login-title">Sign in</h2>
                <p>Use your admin account to continue.</p>
              </div>
              <div className="admin-login-fields">
                <div className="field">
                  <label htmlFor="admin-email">Email</label>
                  <input
                    className="input"
                    id="admin-email"
                    type="email"
                    value={adminEmail}
                    onChange={(event) => setAdminEmail(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="admin-password">Password</label>
                  <input
                    className="input"
                    id="admin-password"
                    type="password"
                    value={adminPassword}
                    onChange={(event) => setAdminPassword(event.target.value)}
                  />
                </div>
                <button
                  className="button primary full"
                  type="button"
                  onClick={() => void handleAdminSignIn()}
                  disabled={isAdminAuthSubmitting || !adminEmail || !adminPassword}
                >
                  {isAdminAuthSubmitting ? "Signing in..." : "Sign in"}
                </button>
              </div>
              {adminAuthMessage && <p className="template-save-status">{adminAuthMessage}</p>}
            </section>
          </section>
        </main>
      ) : adminAccess === "checking" ? (
        <main className="page">
          <section className="section admin-shell">
            <section className="panel">
              <span className="status info">Checking admin access</span>
              <h1 style={{ marginTop: 12 }}>Verifying permissions.</h1>
              <p className="lead">One moment while the admin workspace checks this account.</p>
            </section>
          </section>
        </main>
      ) : adminAccess === "denied" ? (
        <main className="page">
          <section className="section admin-shell">
            <section className="panel">
              <span className="status warn">Access denied</span>
              <h1 style={{ marginTop: 12 }}>This account is not an admin.</h1>
              <p className="lead">Sign in with an admin account to manage requests, fields, notes, statuses, and templates.</p>
              {templateStatus && <p className="template-save-status">{templateStatus}</p>}
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => void handleAdminSignOut()}>
                  Sign out
                </button>
              </div>
            </section>
          </section>
        </main>
      ) : (
      <main className="page">
        <section className="section admin-shell">
          <div className="section-head">
          <div>
            <div className="eyebrow">Admin</div>
            <h1>Requests, fields, notes, statuses, and templates.</h1>
            <p className="lead">
              Work from the client list first, then open each request to review
              fields, internal notes, status, and the generated document preview.
            </p>
          </div>
          <div className="nav-actions">
            <button className={`button ${tab === "requests" ? "primary" : "secondary"}`} onClick={() => navigateToTab("requests")} type="button">
              Requests
            </button>
            <button className={`button ${tab === "fields" ? "primary" : "secondary"}`} onClick={() => navigateToTab("fields")} type="button">
              Fields
            </button>
            <button className={`button ${tab === "templates" ? "primary" : "secondary"}`} onClick={() => navigateToTab("templates")} type="button">
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
                    <th>Client Name</th>
                    <th>Entity</th>
                    <th>TYPE</th>
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
                      <td>{getAccountType(request)}</td>
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
                {templateStatus && <p className="template-save-status">{templateStatus}</p>}
              </div>
              <button className="button secondary" type="button">
                Add template version
              </button>
            </div>
            <div className="grid two">
              {templates.map((template) => (
                <article className="card template-config-card" key={template.id}>
                  <div className="toolbar" style={{ marginTop: 0 }}>
                    <span className="status">{template.active ? "active" : "inactive"}</span>
                    <span className="status info">{template.format || "plain"}</span>
                  </div>
                  <h3 style={{ marginTop: 12 }}>{template.name}</h3>
                  <p>{template.description}</p>
                  <small>Family: {template.family} · Version {template.version}</small>
                  <TemplateBodyEditor onSave={saveTemplateChanges} template={template} />
                </article>
              ))}
            </div>
          </section>
        )}
        {tab === "requests" && selected && (
          <RequestDetailModal
            request={selected}
            templates={templates}
            updateStatus={updateStatus}
            updateField={updateField}
            updateInternalNotes={updateInternalNotes}
            deleteRequest={deleteRequest}
            openUploadedFile={openUploadedFile}
            onClose={() => setSelectedId(null)}
          />
        )}
        </section>
      </main>
      )}
    </>
  );
}

function TemplateBodyEditor({
  onSave,
  template
}: {
  onSave: (templateId: string, htmlBody: string) => Promise<void>;
  template: DocumentTemplate;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const initialBodyRef = useRef(getEditableTemplateBody(template));
  const initializedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState("");

  function setEditorNode(node: HTMLDivElement | null) {
    editorRef.current = node;
    if (node && !initializedRef.current) {
      node.innerHTML = initialBodyRef.current;
      initializedRef.current = true;
    }
  }

  function applyFormat(command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
  }

  function insertMergeField(field: string) {
    editorRef.current?.focus();
    document.execCommand("insertText", false, `{{${field}}}`);
  }

  async function saveChanges() {
    const nextBody = editorRef.current?.innerHTML || "";
    initialBodyRef.current = nextBody;
    setSaveStatus("Saving...");
    try {
      await onSave(template.id, nextBody);
      setSaveStatus("Changes saved.");
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : "Could not save changes.");
    }
  }

  return (
    <div className="template-editor">
      <div className="template-editor-head">
        <label htmlFor={`${template.id}-body`}>Template body</label>
        <span>Shared caption, legal table, and signature block are added automatically.</span>
      </div>
      <div className="template-editor-toolbar" aria-label={`${template.name} formatting controls`}>
        <button className="button secondary compact-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("bold")}>
          B
        </button>
        <button className="button secondary compact-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("italic")}>
          I
        </button>
        <button className="button secondary compact-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("insertUnorderedList")}>
          Bullets
        </button>
        <button className="button secondary compact-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => applyFormat("insertOrderedList")}>
          Numbers
        </button>
        <button className="button primary compact-action" type="button" onMouseDown={(event) => event.preventDefault()} onClick={saveChanges}>
          Save changes
        </button>
      </div>
      {saveStatus && <p className="template-save-status">{saveStatus}</p>}
      <div
        className="template-body-editor"
        contentEditable
        id={`${template.id}-body`}
        ref={setEditorNode}
        role="textbox"
        suppressContentEditableWarning
      />
      <div className="template-merge-list">
        {(template.mergeFields || []).map((field) => (
          <button
            className="template-merge-chip"
            key={field}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => insertMergeField(field)}
          >
            {"{{"}{field}{"}}"}
          </button>
        ))}
      </div>
    </div>
  );
}

function RequestDetailModal({
  request,
  templates,
  updateStatus,
  updateField,
  updateInternalNotes,
  deleteRequest,
  openUploadedFile,
  onClose
}: {
  request: QdroRequest;
  templates: DocumentTemplate[];
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  updateInternalNotes: (id: string, body: string) => void;
  deleteRequest: (id: string) => Promise<boolean>;
  openUploadedFile: (requestId: string, file: RequestFile) => Promise<void>;
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
          <div className="modal-head-actions">
            <button className="button secondary" type="button" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Hide preview" : "Preview document"}
            </button>
            <button className="button secondary" type="button" onClick={onClose} aria-label="Close request detail">
              Close
            </button>
          </div>
        </div>
        {showPreview && (
          <div className="request-preview-panel">
            <DocumentPreview request={request} templates={templates} />
          </div>
        )}
        <div className="request-modal-grid">
          <RequestEditor
            request={request}
            updateStatus={updateStatus}
            updateField={updateField}
            updateInternalNotes={updateInternalNotes}
            deleteRequest={deleteRequest}
            openUploadedFile={openUploadedFile}
          />
        </div>
      </section>
    </div>
  );
}

function RequestEditor({
  request,
  updateStatus,
  updateField,
  updateInternalNotes,
  deleteRequest,
  openUploadedFile
}: {
  request: QdroRequest;
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  updateInternalNotes: (id: string, body: string) => void;
  deleteRequest: (id: string) => Promise<boolean>;
  openUploadedFile: (requestId: string, file: RequestFile) => Promise<void>;
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
        <InternalNotes request={request} updateInternalNotes={updateInternalNotes} />
        {request.files.length > 0 && (
          <section className="admin-intake-step">
            <div>
              <span className="status info">Uploaded documents</span>
              <p>Files saved with this request.</p>
            </div>
            <div className="ai-file-list">
              {request.files.map((file) => (
                <article className="mini-check" key={file.id}>
                  <span className="icon">✓</span>
                  <span>
                    <strong>{file.label}</strong>
                    <small style={{ display: "block", color: "var(--muted)" }}>{file.fileName}</small>
                    {(file.storagePath || file.url) && (
                      <button className="muted-link inline-button" type="button" onClick={() => openUploadedFile(request.id, file)}>
                        Open uploaded file
                      </button>
                    )}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}
        <div className="admin-intake-sections">
          {intakeSteps.filter((step) => step.id !== "uploads").map((step) => {
            const visibleFields = step.fields.filter((field) => isAdminFieldVisible(field, request.fields));

            return (
              <section className="admin-intake-step" key={step.id}>
                <div>
                  <span className="status info">{step.title}</span>
                  {step.description && <p>{step.description}</p>}
                </div>
                {step.id === "parties" ? (
                  <AdminPartyFieldGroups fields={visibleFields} request={request} updateField={updateField} />
                ) : (
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
                )}
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
        <div className="toolbar">
          <button
            className="button danger"
            type="button"
            onClick={() => {
              if (window.confirm("Delete this request and its uploaded files?")) {
                void deleteRequest(request.id);
              }
            }}
          >
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
  const isSsnField = isSsnFieldId(field.id);
  const isPhoneField = field.type === "phone";
  const value = request.fields[field.id];
  const rawValue = typeof value === "string" ? value : "";
  const stringValue = isSsnField
    ? formatSsnInput(rawValue)
    : isPhoneField
      ? formatPhoneInput(rawValue)
      : field.type === "date"
        ? normalizeAiFieldValue(field, rawValue)
        : rawValue;
  const common = {
    id: inputId,
    name: field.id,
    value: stringValue,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      updateField(request.id, field.id, isSsnField ? formatSsnInput(event.target.value) : isPhoneField ? formatPhoneInput(event.target.value) : event.target.value)
  };
  const conditionalHelp = getConditionalHelp(field, request.fields);
  const fieldClassName = ["field", field.fullWidth ? "full-field" : "", field.constrained ? "constrained-field" : ""].filter(Boolean).join(" ");
  const options = getAdminFieldOptions(field);

  if (field.type === "radio") {
    return (
      <fieldset className="field full-field radio-field">
        <legend>{field.label}</legend>
        {field.help && <small>{field.help}</small>}
        {conditionalHelp && <small>{conditionalHelp}</small>}
        <div className="choice-row">
          {options.map((option) => (
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
      <div className={fieldClassName}>
        <label htmlFor={inputId}>{field.label}</label>
        {field.help && <small>{field.help}</small>}
        {conditionalHelp && <small>{conditionalHelp}</small>}
        <select className="select" {...common}>
          <option value="">Choose one</option>
          {options.map((option) => (
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
        {conditionalHelp && <small>{conditionalHelp}</small>}
        <textarea className="textarea" {...common} placeholder={field.placeholder} />
      </div>
    );
  }

  if (field.type === "file") {
    return (
      <div className="field">
        <label htmlFor={inputId}>{field.label}</label>
        {field.help && <small>{field.help}</small>}
        {conditionalHelp && <small>{conditionalHelp}</small>}
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

  const type =
    isSsnField
      ? "text"
      : field.type === "email"
      ? "email"
      : field.type === "date"
        ? "date"
        : field.type === "phone"
          ? "tel"
          : field.type === "currency" || field.type === "percent"
            ? "number"
            : "text";

  return (
    <div className={fieldClassName}>
      <label htmlFor={inputId}>{field.label}</label>
      {field.help && <small>{field.help}</small>}
      {conditionalHelp && <small>{conditionalHelp}</small>}
      <input
        className="input"
        {...common}
        type={type}
        inputMode={isSsnField || isPhoneField ? "numeric" : undefined}
        pattern={isSsnField || isPhoneField ? "[0-9() -]*" : undefined}
        maxLength={isSsnField ? 11 : isPhoneField ? 14 : undefined}
        placeholder={field.placeholder}
      />
    </div>
  );
}

function AdminPartyFieldGroups({
  fields,
  request,
  updateField
}: {
  fields: IntakeField[];
  request: QdroRequest;
  updateField: (id: string, field: string, value: string) => void;
}) {
  const party1Fields = fields.filter((field) => field.id.startsWith("party1_"));
  const party2Fields = fields.filter((field) => field.id.startsWith("party2_"));
  const remainingFields = fields.filter((field) => !field.id.startsWith("party1_") && !field.id.startsWith("party2_"));

  return (
    <div className="party-field-groups">
      {remainingFields.length > 0 && (
        <div className="field-grid">
          {remainingFields.map((field) => (
            <AdminFieldControl field={field} key={field.id} request={request} updateField={updateField} />
          ))}
        </div>
      )}
      <section className="party-field-group">
        <div className="party-field-group-head">
          <span className="status info">Party 1</span>
        </div>
        <div className="field-grid">
          {party1Fields.map((field) => (
            <AdminFieldControl field={field} key={field.id} request={request} updateField={updateField} />
          ))}
        </div>
      </section>
      <section className="party-field-group party-field-group-secondary">
        <div className="party-field-group-head">
          <span className="status info">Party 2</span>
        </div>
        <div className="field-grid">
          {party2Fields.map((field) => (
            <AdminFieldControl field={field} key={field.id} request={request} updateField={updateField} />
          ))}
        </div>
      </section>
    </div>
  );
}

function InternalNotes({
  request,
  updateInternalNotes
}: {
  request: QdroRequest;
  updateInternalNotes: (id: string, body: string) => void;
}) {
  const internalNoteText = request.notes
    .filter((note) => note.visibility === "internal")
    .map((note) => note.body)
    .join("\n\n");

  return (
    <section className="admin-intake-step internal-notes">
      <div className="field">
        <label htmlFor={`internal-notes-${request.id}`}>Internal Notes</label>
        <textarea
          className="textarea internal-notes-textarea"
          id={`internal-notes-${request.id}`}
          value={internalNoteText}
          onChange={(event) => updateInternalNotes(request.id, event.target.value)}
          placeholder="Add internal notes for this request."
        />
      </div>
    </section>
  );
}

function isAdminFieldVisible(field: IntakeField, data: QdroRequest["fields"]) {
  if (!field.conditional) return true;
  return data[field.conditional.field] === field.conditional.equals;
}

function getConditionalHelp(field: IntakeField, data: QdroRequest["fields"]) {
  if (!field.helpWhen) return "";
  const value = data[field.helpWhen.field];
  return typeof value === "string" && field.helpWhen.values.includes(value) ? field.helpWhen.text : "";
}

function getAdminFieldOptions(field: IntakeField) {
  if (field.id === "division_type") {
    return (field.options || []).filter((option) => option !== "I don't know");
  }

  return field.options || [];
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

function getUpdatedInternalNotes(notes: QdroRequest["notes"], body: string): QdroRequest["notes"] {
  const trimmedBody = body.trim();
  const externalNotes = notes.filter((note) => note.visibility !== "internal");
  if (!trimmedBody) return externalNotes;

  const existingInternalNote = notes.find((note) => note.visibility === "internal");
  return [
    ...externalNotes,
    {
      id: existingInternalNote?.id || "internal-note",
      author: existingInternalNote?.author || "Admin",
      body,
      visibility: "internal",
      createdAt: existingInternalNote?.createdAt || new Date().toISOString()
    }
  ];
}

function getFirebaseAuthMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("auth/invalid-credential")) {
    return "That email/password was not accepted by Firebase. Create the user in Firebase Authentication or reset the password, then try again.";
  }

  if (error instanceof Error) return error.message;
  return "Unable to sign in.";
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

function getAccountType(request: QdroRequest) {
  return String(request.fields.account_type || "—");
}

function mergeRequests(primary: QdroRequest[], fallback: QdroRequest[]) {
  const seen = new Set<string>();
  return [...primary, ...fallback].filter((request) => {
    if (seen.has(request.id)) return false;
    seen.add(request.id);
    return true;
  });
}

function writeFileWindowMessage(fileWindow: Window | null, message: string) {
  fileWindow?.document.open();
  fileWindow?.document.write(
    `<p style="font-family: system-ui, sans-serif; padding: 24px; line-height: 1.5;">${escapeHtml(message)}</p>`
  );
  fileWindow?.document.close();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
