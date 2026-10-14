"use client";

import { useId, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getRequesterIdentity, normalizeAiFieldValue } from "@/lib/ai-intake";
import { intakeSteps, statuses } from "@/lib/content";
import { getEditableTemplateBody } from "@/lib/document-engine";
import { formatFieldOptionLabel, formatPhoneInput, formatSsnInput, isSsnFieldId } from "@/lib/field-format";
import { auth, missingFirebaseConfig } from "@/lib/firebase";
import type { DocumentTemplate, IntakeField, QdroRequest, RequestFile, RequestStatus } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";
import { DocumentPreview } from "./DocumentPreview";
import { PlanLookup } from "./PlanLookup";
import type { GeneratedDocumentFormat, GeneratedDocumentType } from "@/lib/generated-documents";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";

const derivedRequestFieldIds = new Set(["amended_text", "court_county", "district", "prepared_for", "date_certified_sent_to_admin", "total"]);
const adminDocumentFields: IntakeField[] = [
  {
    id: "amended_text",
    label: "Amended text",
    type: "text",
    fullWidth: true,
    constrained: true,
    placeholder: "Example: AMENDED",
    help: "Optional. Used in generated document titles and references, such as AMENDED QUALIFIED DOMESTIC RELATIONS ORDER."
  },
  {
    id: "date_certified_sent_to_admin",
    label: "Date certified sent to plan administrator",
    type: "date",
    fullWidth: true,
    constrained: true,
    help: "Internal tracking date for when the certified order was sent to the plan administrator."
  }
];
// Intake controls outside the main step schema also belong in the field directory.
const additionalIntakeFields: IntakeField[] = [
  { id: "is_ira", label: "Is this account an IRA?", type: "radio", required: true, options: ["Yes", "No"], help: "Determines whether IRA administrator confirmation is needed." },
  { id: "ira_admin_confirmed", label: "IRA administrator confirmed", type: "radio", required: true, options: ["Yes", "No"], conditional: { field: "is_ira", equals: "Yes" }, help: "Whether the IRA administrator confirmed that a QDRO is required." },
  { id: "billing_name", label: "Billing full name", type: "text", required: true, help: "Full name of the person paying for the request." },
  { id: "billing_email", label: "Billing email", type: "email", required: true, help: "Email address where the payment receipt is sent." },
  { id: "billing_address_street", label: "Billing street address", type: "text", required: true },
  { id: "billing_address_line2", label: "Billing address line 2", type: "text" },
  { id: "billing_address_city", label: "Billing city", type: "text", required: true },
  { id: "billing_address_state", label: "Billing state", type: "select", required: true },
  { id: "billing_address_zip", label: "Billing zip code", type: "text", required: true },
  { id: "payment_option", label: "Payment options", type: "radio", required: true, options: ["full", "split"], help: "Payment in full ($550) or half paid by each party ($275 each)." },
  { id: "engagement_terms_agreed", label: "Engagement terms agreement", type: "checkbox", required: true, help: "Records the client's acceptance of the engagement terms." },
  { id: "client_signature", label: "Client signature", type: "text", required: true, help: "Signature drawn by the client when accepting the engagement terms." }
];
const adminFieldGroups = [
  ...intakeSteps,
  { id: "additional-intake", title: "Readiness, billing, and consent", fields: additionalIntakeFields },
  { id: "admin-document", title: "Admin document fields", fields: adminDocumentFields }
];

type AdminTab = "requests" | "fields" | "templates" | "plans";
type AdminAccessState = "checking" | "allowed" | "denied" | "error";
type AdminUploadType = "certified_qdro" | "approval_letter" | "appearance_of_counsel" | "withdrawal_of_counsel";

function adminTabFromPath(pathname: string): AdminTab {
  if (pathname.startsWith("/admin/plans")) return "plans";
  if (pathname.startsWith("/admin/fields")) return "fields";
  if (pathname.startsWith("/admin/templates")) return "templates";
  return "requests";
}

export function AdminClient() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginScreen = pathname === "/admin";
  const tab = adminTabFromPath(pathname);
  const [requests, setRequests] = useState<QdroRequest[]>([]);
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
  const [uploadingRequestId, setUploadingRequestId] = useState("");
  const [removingFileId, setRemovingFileId] = useState("");

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
    return user.getIdToken(true);
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
        setRequests([]);
        setRequestStatus(result.message || "No database requests found yet.");
        return "allowed";
      }

      setRequests(result.requests);
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

  async function uploadAdminFile(requestId: string, uploadType: AdminUploadType, files: FileList | null) {
    if (!files?.length) return false;

    const token = await getAdminToken();
    if (!token) {
      setRequestStatus("Sign in as an admin to upload files.");
      return false;
    }

    const formData = new FormData();
    formData.append("requestId", requestId);
    formData.append("uploadType", uploadType);
    Array.from(files).forEach((file) => formData.append("files", file));

    try {
      setUploadingRequestId(requestId);
      const response = await fetch("/api/admin/upload-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = (await response.json()) as { message?: string; request?: QdroRequest };
      if (!response.ok || !result.request) {
        setRequestStatus(result.message || "Could not upload file.");
        return false;
      }

      setRequests((current) => current.map((item) => item.id === requestId ? result.request as QdroRequest : item));
      setRequestStatus(result.message || "File uploaded.");
      return true;
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Could not upload file.");
      return false;
    } finally {
      setUploadingRequestId("");
    }
  }

  async function removeUploadedFile(requestId: string, file: RequestFile) {
    if (!window.confirm(`Remove ${file.label}: ${file.fileName}?`)) return false;

    const token = await getAdminToken();
    if (!token) {
      setRequestStatus("Sign in as an admin to remove files.");
      return false;
    }

    try {
      setRemovingFileId(file.id);
      const response = await fetch("/api/admin/request-file/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ requestId, fileId: file.id })
      });
      const result = (await response.json()) as { message?: string; request?: QdroRequest };
      if (!response.ok || !result.request) {
        setRequestStatus(result.message || "Could not remove file.");
        return false;
      }

      setRequests((current) => current.map((item) => item.id === requestId ? result.request as QdroRequest : item));
      setRequestStatus(result.message || "File removed.");
      return true;
    } catch (error) {
      setRequestStatus(error instanceof Error ? error.message : "Could not remove file.");
      return false;
    } finally {
      setRemovingFileId("");
    }
  }

  function navigateToTab(nextTab: AdminTab) {
    router.push(`/admin/${nextTab}`);
  }

  async function attachGeneratedDocument(request: QdroRequest, documentType: GeneratedDocumentType, format: GeneratedDocumentFormat) {
    const token = await getAdminToken();
    if (!token) throw new Error("Sign in as an admin to attach documents.");
    const response = await fetch("/api/admin/generated-document", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ requestId: request.id, fields: request.fields, templateFamily: request.templateFamily, documentType, format })
    });
    const result = await response.json() as { message?: string; file?: RequestFile };
    if (!response.ok || !result.file) throw new Error(result.message || "Could not attach document.");
    // Merge only the new attachment so generation never discards unsaved form edits.
    const file = result.file;
    setRequests((current) => current.map((item) => item.id === request.id
      ? { ...item, files: [...item.files, file] } : item));
    return result.message || "Document attached.";
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
            <button className={`button ${tab === "plans" ? "primary" : "secondary"}`} onClick={() => navigateToTab("plans")} type="button">
              Plan Lookup
            </button>
          </div>
        </div>

        {adminAccess === "allowed" && tab === "plans" && adminUser && <PlanLookup key={adminUser.uid} user={adminUser} />}
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
                <p>All intake fields, including readiness, billing, consent, and signature, plus admin document fields. Each entry shows its name, label, and display rules.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Step</th>
                    <th>Name</th>
                    <th>Label</th>
                    <th>Type</th>
                    <th>Conditional</th>
                  </tr>
                </thead>
                <tbody>
                  {adminFieldGroups.flatMap((step) =>
                    step.fields.map((field) => (
                      <tr key={field.id}>
                        <td>{step.title}</td>
                        <td><code>{field.id}</code></td>
                        <td>{field.label}</td>
                        <td>{field.id === "client_signature" ? "signature" : field.type}</td>
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
            uploadAdminFile={uploadAdminFile}
            removeUploadedFile={removeUploadedFile}
            saveRequestChanges={saveRequestChanges}
            attachGeneratedDocument={attachGeneratedDocument}
            hasUnsavedChanges={dirtyRequestIds.includes(selected.id)}
            isSaving={savingRequestId === selected.id}
            isUploadingFile={uploadingRequestId === selected.id}
            removingFileId={removingFileId}
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

function VisibilityIcon({ hidden }: { hidden: boolean }) {
  const maskId = useId();
  return (
    <svg width="20" height="20" style={{ marginRight: 8, flexShrink: 0 }} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      {hidden && (
        <defs>
          <mask id={maskId}>
            <rect width="24" height="24" fill="white" />
            <path d="M3 3 21 21" stroke="black" strokeWidth="5" />
          </mask>
        </defs>
      )}
      <g mask={hidden ? `url(#${maskId})` : undefined}>
        <path fillRule="evenodd" d="M1 12C3.5 7.5 7.5 5 12 5s8.5 2.5 11 7c-2.5 4.5-6.5 7-11 7S3.5 16.5 1 12Zm16 0a5 5 0 1 0-10 0 5 5 0 0 0 10 0Z" clipRule="evenodd" />
        <circle cx="12" cy="12" r="3" />
      </g>
      {hidden && <path d="M3 3 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
    </svg>
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
  uploadAdminFile,
  removeUploadedFile,
  saveRequestChanges,
  attachGeneratedDocument,
  hasUnsavedChanges,
  isSaving,
  isUploadingFile,
  removingFileId,
  onClose
}: {
  request: QdroRequest;
  templates: DocumentTemplate[];
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  updateInternalNotes: (id: string, body: string) => void;
  deleteRequest: (id: string) => Promise<boolean>;
  openUploadedFile: (requestId: string, file: RequestFile) => Promise<void>;
  uploadAdminFile: (requestId: string, uploadType: AdminUploadType, files: FileList | null) => Promise<boolean>;
  removeUploadedFile: (requestId: string, file: RequestFile) => Promise<boolean>;
  saveRequestChanges: (request: QdroRequest) => Promise<void>;
  attachGeneratedDocument: (request: QdroRequest, documentType: GeneratedDocumentType, format: GeneratedDocumentFormat) => Promise<string>;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isUploadingFile: boolean;
  removingFileId: string;
  onClose: () => void;
}) {
  const [showPreview, setShowPreview] = useState(true);
  const [showFields, setShowFields] = useState(true);
  const requester = getRequesterIdentity(request.fields, request.clientEmail);
  const clientPartyHeading = getClientPartyHeading(request);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="request-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-sticky-header">
        <div className="modal-head">
          <div className="modal-heading">
            <span className="status info">{getEntityType(request)} · {getAccountType(request)}</span>
            <h2 id="request-modal-title" style={{ marginTop: 6, marginBottom: 0 }}>{clientPartyHeading || requester.name || request.clientName}</h2>
          </div>
          <div className="modal-head-actions">
            <button className="modal-close-button" type="button" onClick={onClose} aria-label="Close request detail">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="modal-panel-controls" role="group" aria-label="Visible panels">
              <button className="button secondary" type="button" aria-expanded={showFields} onClick={() => setShowFields(!showFields)}>
                <VisibilityIcon hidden={showFields} />
                {showFields ? "Hide fields" : "Show fields"}
              </button>
            <button className="button secondary" type="button" aria-expanded={showPreview} onClick={() => setShowPreview(!showPreview)}>
              <VisibilityIcon hidden={showPreview} />
              {showPreview ? "Hide preview" : "Show preview"}
            </button>
        </div>
        </div>
        <div className={`request-modal-grid${showPreview && showFields ? " with-preview" : ""}`}>
          {showFields && (
            <div className="request-fields-panel">
          <RequestEditor
            request={request}
            updateStatus={updateStatus}
            updateField={updateField}
            updateInternalNotes={updateInternalNotes}
            deleteRequest={deleteRequest}
            openUploadedFile={openUploadedFile}
            uploadAdminFile={uploadAdminFile}
            removeUploadedFile={removeUploadedFile}
            isUploadingFile={isUploadingFile}
            removingFileId={removingFileId}
            onClose={onClose}
          />
          <div className="modal-save-footer">
            <span className={`status ${hasUnsavedChanges ? "warn" : "info"}`}>
              {hasUnsavedChanges ? "Unsaved changes" : "Saved"}
            </span>
            <button className="button primary compact-action" type="button" onClick={() => void saveRequestChanges(request)} disabled={!hasUnsavedChanges || isSaving}>
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </div>
            </div>
          )}
          {showPreview && (
            <div className="request-preview-panel">
              <DocumentPreview request={request} templates={templates}
                onAttachDocument={(documentType, format) => attachGeneratedDocument(request, documentType, format)} />
            </div>
          )}
        </div>

      </section>
    </div>
  );
}

function RequestTableRow({ request, onEdit }: { request: QdroRequest; onEdit: () => void }) {
  const requester = getRequesterIdentity(request.fields, request.clientEmail);

  return (
    <tr>
      <td>
        <span className={`status ${request.status === "Pending" ? "warn" : "info"}`}>{request.status}</span>
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
  openUploadedFile,
  uploadAdminFile,
  removeUploadedFile,
  isUploadingFile,
  removingFileId,
  onClose
}: {
  request: QdroRequest;
  updateStatus: (id: string, status: RequestStatus) => void;
  updateField: (id: string, field: string, value: string) => void;
  updateInternalNotes: (id: string, body: string) => void;
  deleteRequest: (id: string) => Promise<boolean>;
  openUploadedFile: (requestId: string, file: RequestFile) => Promise<void>;
  uploadAdminFile: (requestId: string, uploadType: AdminUploadType, files: FileList | null) => Promise<boolean>;
  removeUploadedFile: (requestId: string, file: RequestFile) => Promise<boolean>;
  isUploadingFile: boolean;
  removingFileId: string;
  onClose: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminUploadType, setAdminUploadType] = useState<AdminUploadType>("certified_qdro");
  const schemaFieldIds = new Set(intakeSteps.flatMap((step) => step.fields.map((field) => field.id)));
  const hiddenAdminFieldIds = new Set(["client_signature", "entity_name", "wordpress_client_signature_url", "wordpress_status"]);
  const extraFields = Object.entries(request.fields).filter(
    ([field, value]) => !hiddenAdminFieldIds.has(field) && !schemaFieldIds.has(field) && !derivedRequestFieldIds.has(field) && hasDisplayValue(value)
  );
  const clientSignature = typeof request.fields.client_signature === "string" ? request.fields.client_signature : "";

  async function handleDeleteRequest() {
    if (isDeleting || !window.confirm("Delete this request and its uploaded files?")) return;

    setIsDeleting(true);
    const wasDeleted = await deleteRequest(request.id);
    if (wasDeleted) {
      onClose();
      return;
    }
    setIsDeleting(false);
  }

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
        <section className="admin-intake-step">
          <div>
            <span className="status info">Internal uploads</span>
          </div>
          <div className="admin-upload-row">
            <label className="field compact-upload-field">
              <span>Document type</span>
              <select className="select" value={adminUploadType} onChange={(event) => setAdminUploadType(event.target.value as AdminUploadType)}>
                <option value="certified_qdro">Certified QDRO</option>
                <option value="approval_letter">Approval letter or Proof of Division</option>
                <option value="appearance_of_counsel">Appearance of Counsel</option>
                <option value="withdrawal_of_counsel">Withdrawal of Counsel</option>
              </select>
            </label>
            <label className="button secondary compact-action admin-upload-button">
              {isUploadingFile ? "Uploading..." : "Attach file"}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png"
                multiple
                disabled={isUploadingFile}
                onChange={async (event) => {
                  const didUpload = await uploadAdminFile(request.id, adminUploadType, event.target.files);
                  if (didUpload) event.target.value = "";
                }}
              />
            </label>
          </div>
        </section>
        {request.files.length > 0 && (
          <section className="admin-intake-step">
            <div>
              <span className="status info">Attached documents</span>
            </div>
            <div className="ai-file-list">
              {request.files.map((file) => {
                const canOpenFile = Boolean(file.storagePath || (file.url && !isWordPressUploadUrl(file.url)));
                const canRemoveFile = canRemoveUploadedFile(file);
                return (
                  <article className="mini-check" key={file.id}>
                    <span className="icon">✓</span>
                    <span>
                      <strong>{file.label}</strong>
                      <small style={{ display: "block", color: "var(--muted)" }}>{file.fileName}</small>
                      {canOpenFile ? (
                        <span className="file-action-row">
                          <button className="muted-link inline-button" type="button" onClick={() => openUploadedFile(request.id, file)}>
                            {/\.docx$/i.test(file.fileName || "") ? "Save document" : "Open document"}
                          </button>
                          {canRemoveFile && (
                            <button
                              className="muted-link inline-button danger-link"
                              type="button"
                              disabled={removingFileId === file.id}
                              onClick={() => void removeUploadedFile(request.id, file)}
                            >
                              {removingFileId === file.id ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </span>
                      ) : (
                        <span className="file-action-row">
                          <small style={{ display: "block", color: "var(--muted)" }}>Needs migration from old WordPress storage</small>
                          {canRemoveFile && (
                            <button
                              className="muted-link inline-button danger-link"
                              type="button"
                              disabled={removingFileId === file.id}
                              onClick={() => void removeUploadedFile(request.id, file)}
                            >
                              {removingFileId === file.id ? "Removing..." : "Remove"}
                            </button>
                          )}
                        </span>
                      )}
                    </span>
                  </article>
                );
              })}
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
            onClick={() => void handleDeleteRequest()}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete request"}
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
  const fieldClassName = ["field", field.fullWidth ? "full-field" : "", field.constrained ? "constrained-field" : ""].filter(Boolean).join(" ");
  const options = getAdminFieldOptions(field);

  if (field.type === "radio") {
    return (
      <fieldset className="field full-field radio-field">
        <legend>{field.label}</legend>
        {field.help && <small>{field.help}</small>}
        <div className="choice-row">
          {options.map((option) => (
            <label className="choice" key={option}>
              <input
                type="radio"
                name={field.id}
                checked={value === option}
                onChange={() => updateField(request.id, field.id, option)}
              />
              <span>{formatFieldOptionLabel(field.id, option)}</span>
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
        <select className="select" {...common}>
          <option value="">Choose one</option>
          {options.map((option) => (
            <option value={option} key={option}>
              {formatFieldOptionLabel(field.id, option)}
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
  const isImageSignature = isDisplayableSignature(signature);

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

function isDisplayableSignature(signature: string) {
  if (signature.startsWith("data:image/")) return true;
  try {
    const parsed = new URL(signature);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
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
  const editorRef = useRef<HTMLDivElement>(null);
  const internalNoteBody = request.notes
    .filter((note) => note.visibility === "internal")
    .map((note) => note.body)
    .join("\n\n");
  const editorHtml = formatNoteBodyForEditor(internalNoteBody);

  useEffect(() => {
    if (!editorRef.current || editorRef.current.innerHTML === editorHtml) return;
    editorRef.current.innerHTML = editorHtml;
  }, [editorHtml, request.id]);

  function applyFormat(command: "bold" | "italic" | "underline" | "insertUnorderedList" | "insertOrderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
    updateInternalNotes(request.id, editorRef.current?.innerHTML || "");
  }

  function syncNotes() {
    updateInternalNotes(request.id, editorRef.current?.innerHTML || "");
  }

  return (
    <section className="admin-intake-step internal-notes">
      <div className="template-editor internal-notes-editor">
        <div className="template-editor-head">
          <label htmlFor={`internal-notes-${request.id}`}>Internal Notes</label>
        </div>
        <div className="template-editor-shell">
          <div className="template-editor-toolbar" aria-label="Internal notes formatting controls">
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
          </div>
          <div
            className="template-body-editor internal-notes-html-editor"
            contentEditable
            data-placeholder="Add internal notes for this request."
            id={`internal-notes-${request.id}`}
            ref={editorRef}
            role="textbox"
            aria-multiline="true"
            onBlur={syncNotes}
            onInput={syncNotes}
            suppressContentEditableWarning
          />
        </div>
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
  const trimmedBody = stripHtml(body).trim();
  const externalNotes = notes.filter((note) => note.visibility !== "internal");
  if (!trimmedBody) return externalNotes;

  const existingInternalNote = notes.find((note) => note.visibility === "internal");
  return [
    ...externalNotes,
    {
      id: existingInternalNote?.id || "internal-note",
      author: existingInternalNote?.author || "Admin",
      body: sanitizeNoteHtml(body),
      visibility: "internal",
      createdAt: existingInternalNote?.createdAt || new Date().toISOString()
    }
  ];
}

function formatNoteBodyForEditor(body: string) {
  const normalizedBody = decodeNoteHtmlEntities(body).replace(/\r\n?/g, "\n");
  const trimmed = normalizedBody.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return sanitizeNoteHtml(trimmed);

  return formatPlainNoteText(trimmed)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function formatPlainNoteText(value: string) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function decodeNoteHtmlEntities(value: string) {
  if (!/&(?:lt|gt|amp|quot|#039|apos|nbsp);/i.test(value)) return value;

  return value
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function sanitizeNoteHtml(html: string) {
  if (typeof window === "undefined") return html;

  const allowedTags = new Set(["A", "B", "BR", "DIV", "EM", "I", "LI", "OL", "P", "SPAN", "STRONG", "U", "UL"]);
  const template = document.createElement("template");
  template.innerHTML = html;

  function cleanNode(node: Node) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as HTMLElement;
        if (!allowedTags.has(element.tagName)) {
          element.replaceWith(...Array.from(element.childNodes));
          return;
        }

        [...element.attributes].forEach((attribute) => {
          const name = attribute.name.toLowerCase();
          if (element.tagName === "A" && name === "href" && /^(https?:|mailto:|tel:)/i.test(attribute.value)) return;
          element.removeAttribute(attribute.name);
        });
      }
      cleanNode(child);
    });
  }

  cleanNode(template.content);
  return template.innerHTML;
}

function stripHtml(html: string) {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, " ");
  const element = document.createElement("div");
  element.innerHTML = sanitizeNoteHtml(html);
  return element.textContent || "";
}

function canRemoveUploadedFile(file: RequestFile) {
  return (
    file.id.startsWith("admin-generated-") ||
    file.id.startsWith("admin-certified_qdro-") ||
    file.id.startsWith("admin-approval_letter-") ||
    file.id.startsWith("admin-appearance_of_counsel-") ||
    file.id.startsWith("admin-withdrawal_of_counsel-")
  );
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

function getClientPartyHeading(request: QdroRequest) {
  const party1Name = String(request.fields.party1_name || "").trim();
  const party2Name = String(request.fields.party2_name || "").trim();
  const requesterRole = String(request.fields.requester_role || "");
  const requesterAffiliation = String(request.fields.requester_affiliation || "");

  const clientIsParty2 =
    requesterRole === "I am the second name listed in the court case title" ||
    (requesterRole === "I am requesting this for someone else" && requesterAffiliation === "Party 2");

  if (clientIsParty2 && party1Name && party2Name) return `${party2Name} v. ${party1Name}`;

  if (party1Name && party2Name) return `${party1Name} v. ${party2Name}`;
  return party1Name || party2Name;
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

function writeFileWindowMessage(fileWindow: Window | null, message: string) {
  fileWindow?.document.open();
  fileWindow?.document.write(
    `<p style="font-family: system-ui, sans-serif; padding: 24px; line-height: 1.5;">${escapeHtml(message)}</p>`
  );
  fileWindow?.document.close();
}

function isWordPressUploadUrl(url: string | undefined) {
  if (!url) return false;

  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "utahqdro.com" || host.endsWith(".utahqdro.com");
  } catch {
    return false;
  }
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
  if (request.paymentState === "waived") return 0;

  const fieldTotal = request.fields.total;
  if (typeof fieldTotal === "string") {
    const numericTotal = Number(fieldTotal.replace(/[$,]/g, ""));
    if (Number.isFinite(numericTotal)) return numericTotal;
  }

  return 550;
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
