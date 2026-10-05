"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRequesterIdentity, normalizeAiFieldValue } from "@/lib/ai-intake";
import { intakeSteps, sampleRequests, statuses } from "@/lib/content";
import { getEditableTemplateBody, selectTemplateFromList } from "@/lib/document-engine";
import { formatPhoneInput, formatSsnInput, isSsnFieldId } from "@/lib/field-format";
import { auth, missingFirebaseConfig } from "@/lib/firebase";
import type { DocumentTemplate, IntakeField, QdroRequest, RequestFile, RequestStatus } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";
import { DocumentPreview } from "./DocumentPreview";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

const derivedRequestFieldIds = new Set(["amended_text", "court_county", "district", "prepared_for"]);
const adminDocumentFields: IntakeField[] = [
  {
    id: "amended_text",
    label: "Amended text",
    type: "text",
    fullWidth: true,
    constrained: true,
    placeholder: "Example: AMENDED",
    help: "Optional. Used in generated document titles and references, such as AMENDED QUALIFIED DOMESTIC RELATIONS ORDER."
  }
];
type AdminTab = "requests" | "fields" | "templates";
type AdminAccessState = "checking" | "allowed" | "denied" | "error";

function adminTabFromPath(pathname: string): AdminTab {
  if (pathname.startsWith("/admin/fields")) return "fields";
  if (pathname.startsWith("/admin/templates")) return "templates";
  return "requests";
}

export function AdminClient() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginScreen = pathname === "/admin";
  const tab = adminTabFromPath(pathname);
  const [requests, setRequests] = useState(sampleRequests);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthMessage, setAdminAuthMessage] = useState("");
  const [isAdminAuthSubmitting, setIsAdminAuthSubmitting] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccessState>("checking");
  const [templateStatus, setTemplateStatus] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirtyRequestIds, setDirtyRequestIds] = useState<string[]>([]);
  const [savingRequestId, setSavingRequestId] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase();
    return requests.filter((request) => {
      const requester = getRequesterIdentity(request.fields, request.clientEmail);
      return (
        request.clientName.toLowerCase().includes(normalized) ||
        request.clientEmail.toLowerCase().includes(normalized) ||
        requester.name.toLowerCase().includes(normalized) ||
        requester.email.toLowerCase().includes(normalized) ||
        request.id.toLowerCase().includes(normalized) ||
        request.status.toLowerCase().includes(normalized)
      );
    });
  }, [query, requests]);

  const selected = requests.find((request) => request.id === selectedId) || null;
  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) || templates[0] || null;

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
        void loadRequests().then((accessState) => {
          if (accessState !== "allowed") {
            setAdminAccess(accessState);
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
      setTemplateStatus("");
    } catch {
      setTemplateStatus("Could not load database templates.");
    }
  }

  async function loadRequests(): Promise<AdminAccessState> {
    const token = await getAdminToken();
    if (!token) return "denied";

    try {
      const response = await fetch("/api/admin/requests", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = (await response.json()) as { message?: string; requests?: QdroRequest[] };
      if (!response.ok) {
        setRequestStatus(result.message || "Could not load database requests.");
        return response.status === 401 || response.status === 403 ? "denied" : "error";
      }
      if (!result.requests?.length) {
        setRequestStatus(result.message || "No database requests found yet. Showing demo requests.");
        return "allowed";
      }

      setRequests(mergeRequests(result.requests, sampleRequests));
      setRequestStatus("");
      return "allowed";
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Could not load database requests.");
      return "error";
    }
  }

  function updateStatus(requestId: string, status: RequestStatus) {
    markRequestDirty(requestId);
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
    markRequestDirty(requestId);
    setRequests((current) =>
      current.map((request) =>
        request.id === requestId
          ? {
              ...request,
              fields: getUpdatedRequestFields(request.fields, field, value),
              templateFamily: field === "plan_family" ? value : request.templateFamily,
              updatedAt: new Date().toISOString()
            }
          : request
      )
    );
  }

  function updateInternalNotes(requestId: string, body: string) {
    markRequestDirty(requestId);
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

  function markRequestDirty(requestId: string) {
    setDirtyRequestIds((current) => current.includes(requestId) ? current : [...current, requestId]);
  }

  async function saveRequestChanges(request: QdroRequest) {
    const token = await getAdminToken();
    if (!token) {
      setRequestStatus("Sign in as an admin to save request changes.");
      return;
    }

    try {
      setSavingRequestId(request.id);
      const response = await fetch("/api/admin/requests", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestId: request.id,
          fields: request.fields,
          notes: request.notes,
          status: request.status,
          templateFamily: request.templateFamily
        })
      });
      const result = (await response.json()) as { message?: string; request?: QdroRequest };
      if (!response.ok || !result.request) {
        setRequestStatus(result.message || "Could not save request changes.");
        return;
      }

      setRequests((current) => current.map((item) => item.id === request.id ? result.request as QdroRequest : item));
      setDirtyRequestIds((current) => current.filter((id) => id !== request.id));
      setRequestStatus(result.message || "Request changes saved.");
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Could not save request changes.");
    } finally {
      setSavingRequestId("");
    }
  }

  async function deleteRequest(requestId: string) {
    const token = await getAdminToken();
    if (!token) {
      setRequestStatus("Sign in as an admin to delete requests.");
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
        setRequestStatus(result.message || "Could not delete request.");
        return false;
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
      setSelectedId(null);
      setRequestStatus(result.message || "Request deleted.");
      return true;
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Could not delete request.");
      return false;
    }
  }

  async function openUploadedFile(requestId: string, file: RequestFile) {
    const fileWindow = window.open("about:blank", "_blank");
    if (fileWindow) fileWindow.opener = null;
    writeFileWindowMessage(fileWindow, "Opening uploaded file...");

    const token = await getAdminToken();
    if (!token) {
      setRequestStatus("Sign in as an admin to open uploaded files.");
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
        setRequestStatus(result.message || "Could not open uploaded file.");
        writeFileWindowMessage(fileWindow, result.message || "Could not open uploaded file.");
        return;
      }

      if (fileWindow) {
        fileWindow.location.assign(result.url);
      } else {
        const openedWindow = window.open(result.url, "_blank", "noopener,noreferrer");
        if (!openedWindow) {
          setRequestStatus("The uploaded file is ready, but the browser blocked the new tab. Allow popups for this site and try again.");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not open uploaded file.";
      setRequestStatus(message);
      writeFileWindowMessage(fileWindow, message);
    }
  }

  function navigateToTab(nextTab: AdminTab) {
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
  }

  return (
    <>
      {!isLoginScreen && adminAccess !== "checking" && (
        <section className="admin-auth-panel">
          <div>
            <span className={`status ${adminAccess === "allowed" ? "info" : "warn"}`}>
              {adminAccess === "allowed" ? "Admin signed in" : "Access denied"}
            </span>
            <p>{adminUser ? `Signed in as ${adminUser.email || adminUser.uid}.` : "Sign in with an admin account."}</p>
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
      ) : adminAccess === "denied" || adminAccess === "error" ? (
        <main className="page">
          <section className="section admin-shell">
            <section className="panel">
              <span className="status warn">{adminAccess === "denied" ? "Access denied" : "Setup needed"}</span>
              <h1 style={{ marginTop: 12 }}>
                {adminAccess === "denied" ? "This account is not an admin." : "Admin setup needs attention."}
              </h1>
              <p className="lead">
                {adminAccess === "denied"
                  ? "Sign in with an admin account to manage requests, fields, notes, statuses, and templates."
                  : "The admin server could not load requests. Check the production Firebase Admin settings."}
              </p>
              {(requestStatus || templateStatus) && <p className="template-save-status">{requestStatus || templateStatus}</p>}
              <div className="toolbar">
                <button className="button secondary" type="button" onClick={() => void handleAdminSignOut()}>
                  Sign out
                </button>
              </div>
            </section>
          </section>
        </main>
      ) : (
      <main className="page admin-page">
        <section className="section admin-shell">
          <div className="section-head">
          <div>
            <div className="eyebrow">Admin</div>
            <h1>{tab === "fields" ? "Fields" : tab === "templates" ? "Templates" : "Requests"}</h1>
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

        {adminAccess === "allowed" && tab === "requests" && (
          <section className="panel admin-request-panel">
            <div className="admin-list-head">
              <div>
                <span className="status info">{filtered.length} clients</span>
                <h2 style={{ marginTop: 12 }}>Client requests</h2>
                {requestStatus && <p className="template-save-status">{requestStatus}</p>}
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
                    <RequestTableRow request={request} key={request.id} onEdit={() => setSelectedId(request.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {adminAccess === "allowed" && tab === "fields" && (
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

        {adminAccess === "allowed" && tab === "templates" && (
          <section className="panel">
            <div className="section-head">
              <div>
                <span className="status info">Document templates</span>
                {templateStatus && <p className="template-save-status">{templateStatus}</p>}
              </div>
            </div>
            {selectedTemplate ? (
              <div className="template-library">
                <div className="field template-picker">
                  <label htmlFor="admin-template-picker">Template</label>
                  <select
                    className="select"
                    id="admin-template-picker"
                    value={selectedTemplate.id}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                  >
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {getTemplatePickerLabel(template.name)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="template-library-meta">
                  <span className="status">{selectedTemplate.active ? "active" : "inactive"}</span>
                  <small>
                    {getTemplateMetaLabel(selectedTemplate)}
                  </small>
                </div>
                <TemplateBodyEditor key={selectedTemplate.id} onSave={saveTemplateChanges} template={selectedTemplate} />
              </div>
            ) : (
              <p>No templates are available yet.</p>
            )}
          </section>
        )}
        {adminAccess === "allowed" && tab === "requests" && selected && (
          <RequestDetailModal
            request={selected}
            templates={templates}
            updateStatus={updateStatus}
            updateField={updateField}
            updateInternalNotes={updateInternalNotes}
            deleteRequest={deleteRequest}
            openUploadedFile={openUploadedFile}
            saveRequestChanges={saveRequestChanges}
            hasUnsavedChanges={dirtyRequestIds.includes(selected.id)}
            isSaving={savingRequestId === selected.id}
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
  const [hasTextChanges, setHasTextChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  function syncTextChangeState() {
    const currentBody = editorRef.current?.innerHTML || "";
    setHasTextChanges(currentBody !== initialBodyRef.current);
    if (currentBody !== initialBodyRef.current && saveStatus === "Template changes saved.") {
      setSaveStatus("");
    }
  }

  function setEditorNode(node: HTMLDivElement | null) {
    editorRef.current = node;
    if (node && !initializedRef.current) {
      node.innerHTML = initialBodyRef.current;
      initializedRef.current = true;
    }
  }

  function applyFormat(command: "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
    syncTextChangeState();
  }

  function insertMergeField(field: string) {
    editorRef.current?.focus();
    document.execCommand("insertText", false, `{{${field}}}`);
    syncTextChangeState();
  }

  async function saveChanges() {
    if (!hasTextChanges) return;
    const nextBody = editorRef.current?.innerHTML || "";
    setSaveStatus("Saving...");
    try {
      await onSave(template.id, nextBody);
      initialBodyRef.current = nextBody;
      setHasTextChanges(false);
      setSaveStatus("Template changes saved.");
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
      <div className="template-editor-shell">
        <div className="template-editor-toolbar" aria-label={`${template.name} formatting controls`}>
          <FormatButton label="Bold" onClick={() => applyFormat("bold")}>
            <strong>B</strong>
          </FormatButton>
          <FormatButton label="Italic" onClick={() => applyFormat("italic")}>
            <em>I</em>
          </FormatButton>
          <FormatButton label="Underline" onClick={() => applyFormat("underline")}>
            <span className="template-format-underline">U</span>
          </FormatButton>
          <span className="template-format-divider" aria-hidden="true" />
          <FormatButton label="Bulleted list" onClick={() => applyFormat("insertUnorderedList")}>
            <ListIcon ordered={false} />
          </FormatButton>
          <FormatButton label="Numbered list" onClick={() => applyFormat("insertOrderedList")}>
            <ListIcon ordered />
          </FormatButton>
          <div className="template-save-group">
            {saveStatus && <p className="template-save-status">{saveStatus}</p>}
            <button
              className="button primary compact-action template-save-button"
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={saveChanges}
              disabled={!hasTextChanges}
            >
              Save changes
            </button>
          </div>
        </div>
        <div
          className="template-body-editor"
          contentEditable
          id={`${template.id}-body`}
          ref={setEditorNode}
          role="textbox"
          aria-multiline="true"
          onInput={syncTextChangeState}
          suppressContentEditableWarning
        />
      </div>
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

function FormatButton({
  children,
  label,
  onClick
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="template-format-button"
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ListIcon({ ordered }: { ordered: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      {ordered ? (
        <g fill="currentColor" stroke="none" fontSize="6.5" fontFamily="Georgia, serif">
          <text x="0.4" y="6">1</text>
          <text x="0.4" y="12">2</text>
          <text x="0.4" y="17.8">3</text>
        </g>
      ) : (
        <>
          <circle cx="3" cy="4" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="3" cy="10" r="1.15" fill="currentColor" stroke="none" />
          <circle cx="3" cy="16" r="1.15" fill="currentColor" stroke="none" />
        </>
      )}
      <path d="M7.5 4h10.2M7.5 10h10.2M7.5 16h10.2" />
    </svg>
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
  saveRequestChanges,
  hasUnsavedChanges,
  isSaving,
  onClose
}: {
  request: QdroRequest;
  templates: DocumentTemplate[];
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  updateInternalNotes: (id: string, body: string) => void;
  deleteRequest: (id: string) => Promise<boolean>;
  openUploadedFile: (requestId: string, file: RequestFile) => Promise<void>;
  saveRequestChanges: (request: QdroRequest) => Promise<void>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const requester = getRequesterIdentity(request.fields, request.clientEmail);
  const selectedPreviewTemplate = selectTemplateFromList(request, templates);

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
            <span className="status info">{getEntityType(request)} · {getAccountType(request)}</span>
            <h2 id="request-modal-title" style={{ marginTop: 12 }}>{requester.name || request.clientName}</h2>
            <p>
              {requester.email || request.clientEmail} · {getEntityType(request)} · Total {formatCurrency(getRequestTotal(request))}
            </p>
            <p>
              Template: {getTemplatePickerLabel(selectedPreviewTemplate.name)}
            </p>
          </div>
          <div className="modal-head-actions">
            <button className="button secondary" type="button" onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? "Hide preview" : "Preview documents"}
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
        {!showPreview && (
          <div className="modal-save-footer">
            <span className={`status ${hasUnsavedChanges ? "warn" : "info"}`}>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
            </span>
            <button className="button primary compact-action" type="button" onClick={() => void saveRequestChanges(request)} disabled={!hasUnsavedChanges || isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function RequestTableRow({ request, onEdit }: { request: QdroRequest; onEdit: () => void }) {
  const requester = getRequesterIdentity(request.fields, request.clientEmail);

  return (
    <tr>
      <td>
        <span className={`status ${request.status === "Needs Client Info" ? "warn" : "info"}`}>{request.status}</span>
      </td>
      <td>
        <strong>{requester.name || request.clientName}</strong>
        <br />
        <small>{requester.email || request.clientEmail}</small>
      </td>
      <td>{getEntityType(request)}</td>
      <td>{getAccountType(request)}</td>
      <td>{formatDate(request.createdAt)}</td>
      <td>{formatDate(request.updatedAt)}</td>
      <td>
        <button className="button secondary compact-action" type="button" onClick={onEdit}>
          Edit
        </button>
      </td>
      <td>{formatCurrency(getRequestTotal(request))}</td>
    </tr>
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
    ([field, value]) => field !== "client_signature" && !schemaFieldIds.has(field) && !derivedRequestFieldIds.has(field) && hasDisplayValue(value)
  );
  const clientSignature = typeof request.fields.client_signature === "string" ? request.fields.client_signature : "";

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
        <section className="admin-intake-step">
          <div>
            <span className="status info">Document settings</span>
            <p>Backend-only values used when generating and exporting documents.</p>
          </div>
          <div className="field-grid">
            {adminDocumentFields.map((field) => (
              <AdminFieldControl
                field={field}
                key={field.id}
                request={request}
                updateField={updateField}
              />
            ))}
          </div>
        </section>
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
        {clientSignature && <ClientSignaturePreview signature={clientSignature} />}
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

function ClientSignaturePreview({ signature }: { signature: string }) {
  const isImageSignature = signature.startsWith("data:image/");

  return (
    <section className="admin-intake-step">
      <div>
        <span className="status info">Client signature</span>
        <p>Authorization signature saved with this request.</p>
      </div>
      <div className="admin-signature-preview">
        {isImageSignature ? (
          <img alt="Client signature" src={signature} />
        ) : (
          <span>Signature saved</span>
        )}
      </div>
    </section>
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

function getTemplatePickerLabel(templateName: string) {
  return templateName.replace(/\s+QDRO$/i, "");
}

function getTemplateMetaLabel(template: DocumentTemplate) {
  if (template.id === "multi-template-v1") {
    return "Plans: TIAA, Betterment, Merrill Lynch, Kroger, LPL Financial, PCS, Mass Mutual, Milliman, Mission Square, Northwestern Mutual, Wells Fargo, Athene";
  }
  if (template.id === "multi-adp-401k-v1") {
    return "Plans: ADP, Charles Schwab, John Hancock, Transamerica, Vanguard · Account: 401k";
  }

  const plan = template.family === "Supplemental: Appearance of Counsel" ? "Appearance of Counsel" : template.family;
  return `Plan: ${plan}`;
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
