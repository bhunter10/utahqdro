"use client";

import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  type User
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { intakeSteps } from "@/lib/content";
import {
  aiIntakeFieldMap,
  getMissingRequiredAiFields,
  getRequesterRoleHint,
  isAiFieldVisible,
  normalizeAiFieldValue,
  type AiExtractedField,
  type AiExtractionResult,
  type AiFieldConfidence,
  type AiUploadedFile
} from "@/lib/ai-intake";
import { formatPhoneInput, formatSsnInput, isSsnFieldId } from "@/lib/field-format";
import { auth, db, hasFirebaseConfig, missingFirebaseConfig } from "@/lib/firebase";
import type { IntakeField } from "@/lib/types";
import { findUtahCourt } from "@/lib/utah-courts";

const readinessChecks = [
  {
    id: "decreeSigned",
    label: "My divorce decree has been signed by the judge.",
    blocker: "A QDRO request cannot move forward until the decree is signed."
  },
  {
    id: "hasDecreePdf",
    label: "I have a copy of the signed decree.",
    blocker: "You can usually get this from your lawyer or the court."
  },
  {
    id: "hasStatement",
    label: "I have a statement for the retirement account being divided.",
    blocker: "The account owner can usually download this from the plan website."
  },
  {
    id: "hasPersonalInfo",
    label: "I can confirm both parties’ address, phone, email, SSN, date of birth, marriage date, and divorce date.",
    blocker: "AI may find some of this, but you will still confirm it before submission."
  }
];

const iraWarning =
  "Warning, IRAs do not normally need a QDRO to divide. Give your decree to the financial provider where the IRA is being held, and they should divide it for you. On very RARE occasions, an IRA may be inside of a qualified account, and the plan administrator specifically requests a QDRO be drafted and sent to them. If you proceed and request a QDRO, and it turns out a QDRO was not needed, there will be no refunds issued.";

type WizardData = Record<string, string | boolean>;
type Stage = "readiness" | "account" | "uploads" | "missing" | "confirm" | "submitted";

const storageKey = "utah-qdro-ai-intake";

export function AiIntakeWizard() {
  const [stage, setStage] = useState<Stage>("readiness");
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [data, setData] = useState<WizardData>({});
  const [uploadedFiles, setUploadedFiles] = useState<AiUploadedFile[]>([]);
  const [extraction, setExtraction] = useState<AiExtractionResult>({ summary: "", fields: [] });
  const [clientUser, setClientUser] = useState<User | null>(null);
  const [accountMode, setAccountMode] = useState<"create" | "sign-in">("create");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [questionFieldIds, setQuestionFieldIds] = useState<string[]>([]);
  const [requestId, setRequestId] = useState(() => `QDRO-AI-${Date.now()}`);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    const parsed = JSON.parse(saved) as {
      data?: WizardData;
      ready?: Record<string, boolean>;
      uploadedFiles?: AiUploadedFile[];
      extraction?: AiExtractionResult;
      questionFieldIds?: string[];
      requestId?: string;
      stage?: Stage;
    };
    if (parsed.requestId) setRequestId(parsed.requestId);
    setData(parsed.data || {});
    setReady(parsed.ready || {});
    setUploadedFiles(parsed.uploadedFiles || []);
    setExtraction(parsed.extraction || { summary: "", fields: [] });
    setQuestionFieldIds(parsed.questionFieldIds || []);
    if (parsed.stage && parsed.stage !== "submitted") setStage(parsed.stage);
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
      window.localStorage.setItem(storageKey, JSON.stringify({ data, ready, uploadedFiles, extraction, questionFieldIds, requestId, stage }));
    }, 350);
    return () => window.clearTimeout(handle);
  }, [data, extraction, questionFieldIds, ready, requestId, stage, uploadedFiles]);

  const readyComplete = readinessChecks.every((check) => ready[check.id]) && isIraScreeningComplete(data);
  const hasExtraction = Boolean(extraction.summary || extraction.fields.length);

  useEffect(() => {
    if (!hasExtraction && (stage === "missing" || stage === "confirm")) {
      setStage("uploads");
    }
  }, [hasExtraction, stage]);

  const missingFields = useMemo(
    () => getVisibleQuestionFields(data, uploadedFiles, questionFieldIds, stage),
    [data, questionFieldIds, stage, uploadedFiles]
  );
  const progress = getProgress(stage, readyComplete, clientUser, uploadedFiles.length, missingFields.length);

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

  async function handleAccountSubmit() {
    setMessage("");
    if (!hasFirebaseConfig || !auth || !db) {
      setMessage(`Firebase is not configured. Missing: ${missingFirebaseConfig.join(", ")}.`);
      return;
    }

    try {
      setIsWorking(true);
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
      setStage("uploads");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue. Please try again.");
    } finally {
      setIsWorking(false);
    }
  }

  async function handleFilesSelected(kind: AiUploadedFile["kind"], files: FileList | null) {
    setMessage("");
    if (!files?.length) return;
    if (!clientUser || !auth?.currentUser) {
      setMessage("Sign in before uploading documents.");
      return;
    }

    try {
      setIsWorking(true);
      const formData = new FormData();
      formData.append("requestId", requestId);
      formData.append("kind", kind);

      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/ai-intake/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const result = (await response.json()) as { message?: string; files?: AiUploadedFile[] };
      if (!response.ok || !result.files) {
        setMessage(result.message || "Could not upload the selected documents.");
        return;
      }

      setUploadedFiles((current) => [...current, ...(result.files || [])]);
      clearExtractionState();
      setData((current) => {
        const next = { ...current };
        for (const uploadedFile of result.files || []) {
          if (uploadedFile.kind === "decree") next.signed_decree = uploadedFile.name;
          if (uploadedFile.kind === "statement") next.account_statement = uploadedFile.name;
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not upload the selected documents.");
    } finally {
      setIsWorking(false);
    }
  }

  async function deleteUploadedFile(file: AiUploadedFile) {
    setMessage("");
    if (!auth?.currentUser) {
      setMessage("Sign in before deleting documents.");
      return;
    }

    try {
      setIsWorking(true);
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/ai-intake/delete-file", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storagePath: file.storagePath })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(result.message || "Could not delete that file.");
        return;
      }

      setUploadedFiles((current) => current.filter((uploadedFile) => uploadedFile.id !== file.id));
      clearExtractionState();
      setData((current) => {
        const remainingFiles = uploadedFiles.filter((uploadedFile) => uploadedFile.id !== file.id);
        const next = { ...current };
        if (file.kind === "decree") {
          const replacement = remainingFiles.find((uploadedFile) => uploadedFile.kind === "decree");
          if (replacement) next.signed_decree = replacement.name;
          else delete next.signed_decree;
        }
        if (file.kind === "statement") {
          const replacement = remainingFiles.find((uploadedFile) => uploadedFile.kind === "statement");
          if (replacement) next.account_statement = replacement.name;
          else delete next.account_statement;
        }
        return next;
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not delete that file.");
    } finally {
      setIsWorking(false);
    }
  }

  async function runExtraction() {
    setMessage("");
    if (!uploadedFiles.length) {
      setMessage("Upload at least one document first.");
      return;
    }

    try {
      setIsWorking(true);
      setIsExtracting(true);
      const response = await fetch("/api/ai-intake/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles })
      });
      const result = (await response.json()) as { message?: string; result?: AiExtractionResult };
      if (!response.ok || !result.result) {
        setMessage(result.message || "Could not extract document details.");
        return;
      }

      const nextData = { ...data };
      for (const field of result.result.fields) {
        if (field.confidence !== "missing" && field.value) {
          const intakeField = aiIntakeFieldMap.get(field.id);
          nextData[field.id] = normalizeAiFieldValue(intakeField, field.value);
          if (field.id === "percent_award" && field.value !== nextData[field.id]) {
            nextData.special_terms = appendSpecialTerm(
              nextData.special_terms,
              `Percentage award detail: ${field.value}${field.note ? ` (${field.note})` : ""}`
            );
          }
          if (field.id === "fixed_award" && field.value !== nextData[field.id]) {
            nextData.special_terms = appendSpecialTerm(
              nextData.special_terms,
              `Fixed award detail: ${field.value}${field.note ? ` (${field.note})` : ""}`
            );
          }
        }
      }
      setData(nextData);
      setExtraction(result.result);
      setQuestionFieldIds(getMissingAiFieldsForUploads(nextData, uploadedFiles).map((field) => field.id));
      setStage("missing");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not extract document details.");
    } finally {
      setIsWorking(false);
      setIsExtracting(false);
    }
  }

  async function submitRequest() {
    setMessage("");
    if (!auth?.currentUser) {
      setMessage("Sign in before submitting.");
      return;
    }

    const remaining = getMissingAiFieldsForUploads(data, uploadedFiles);

    try {
      setIsWorking(true);
      const token = await auth.currentUser.getIdToken();
      const response = await fetch("/api/ai-intake/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requestId,
          fields: data,
          files: uploadedFiles,
          extraction,
          missingFieldLabels: remaining.map((field) => field.label)
        })
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        setMessage(result.message || "Could not submit this request.");
        return;
      }

      setStage("submitted");
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit this request.");
    } finally {
      setIsWorking(false);
    }
  }

  function continueFromMissingQuestions() {
    setMessage("");
    const remaining = getMissingAiFieldsForUploads(data, uploadedFiles);
    setQuestionFieldIds(remaining.map((field) => field.id));
    setStage("confirm");
  }

  function clearExtractionState() {
    setExtraction({ summary: "", fields: [] });
    setQuestionFieldIds([]);
    if (stage === "missing" || stage === "confirm") {
      setStage("uploads");
    }
  }

  function resetAiDraft() {
    window.localStorage.removeItem(storageKey);
    setData({});
    setUploadedFiles([]);
    setExtraction({ summary: "", fields: [] });
    setQuestionFieldIds([]);
    setMessage("");
    setRequestId(`QDRO-AI-${Date.now()}`);
    setStage(readyComplete ? "uploads" : "readiness");
  }

  return (
    <div className="form-layout ai-intake-layout">
      <aside className="sidebar">
        <div style={{ padding: 10 }}>
          <strong>AI request progress</strong>
          <p style={{ margin: "6px 0 12px" }}>Experimental document-first intake</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <button className="button ghost full reset-draft-button" type="button" onClick={resetAiDraft}>
            Start over
          </button>
        </div>
        {[
          ["readiness", "Readiness"],
          ["account", "Account setup"],
          ["uploads", "Upload & extract"],
          ...(hasExtraction ? [["missing", "Remaining questions"], ["confirm", "Confirm everything"]] : [])
        ].map(([id, label]) => (
          <button className={`step-tab ${stage === id ? "active" : ""}`} key={id} type="button" onClick={() => setStage(id as Stage)}>
            {label}
          </button>
        ))}
      </aside>

      <div className="wizard">
        <section className="panel ai-intake-head">
          <span className="status info">AI assisted intake</span>
          <h1>AI-assisted QDRO request</h1>
          <p>
            The original request page stays unchanged. This version saves the uploaded files, tries to fill the QDRO intake from them, asks for anything missing, and sends the request to admin review.
          </p>
        </section>

        {message && <p className="ai-intake-message">{message}</p>}

        {stage === "readiness" && (
          <ReadinessStep
            data={data}
            ready={ready}
            readyComplete={readyComplete}
            setReady={setReady}
            updateField={updateField}
            onContinue={() => setStage("account")}
          />
        )}

        {stage === "account" && (
          <AccountStep
            accountEmail={accountEmail}
            accountMode={accountMode}
            accountPassword={accountPassword}
            clientUser={clientUser}
            isWorking={isWorking}
            onContinue={() => setStage("uploads")}
            onSubmit={handleAccountSubmit}
            setAccountEmail={setAccountEmail}
            setAccountMode={setAccountMode}
            setAccountPassword={setAccountPassword}
          />
        )}

        {stage === "uploads" && (
          <UploadStep
            files={uploadedFiles}
            isExtracting={isExtracting}
            isWorking={isWorking}
            onDeleteFile={deleteUploadedFile}
            onFilesSelected={handleFilesSelected}
            onRunExtraction={runExtraction}
          />
        )}

        {stage === "missing" && (
          <MissingQuestionsStep
            key={questionFieldIds.join("|") || "initial-missing-questions"}
            data={data}
            extraction={extraction}
            missingFields={missingFields}
            onBack={() => setStage("uploads")}
            onContinue={continueFromMissingQuestions}
            updateField={updateField}
          />
        )}

        {stage === "confirm" && (
          <ConfirmStep
            data={data}
            extraction={extraction}
            isWorking={isWorking}
            onBack={() => setStage("missing")}
            onSubmit={submitRequest}
            updateField={updateField}
          />
        )}

        {stage === "submitted" && (
          <section className="panel">
            <span className="status info">Submitted</span>
            <h2>Request sent to admin review.</h2>
            <p>
              This request is saved as {requestId}. You can open the admin requests workspace to review the uploaded files, confirmed answers, and internal AI note.
            </p>
            <div className="toolbar">
              <Link className="button primary" href="/admin/requests">
                Open admin requests
              </Link>
              <Link className="button secondary" href="/qdro-request-ai">
                Start another AI request
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ReadinessStep({
  data,
  ready,
  readyComplete,
  setReady,
  updateField,
  onContinue
}: {
  data: WizardData;
  ready: Record<string, boolean>;
  readyComplete: boolean;
  setReady: Dispatch<SetStateAction<Record<string, boolean>>>;
  updateField: (id: string, value: string | boolean) => void;
  onContinue: () => void;
}) {
  const isIra = data.is_ira === "Yes";
  const administratorConfirmed = data.ira_admin_confirmed === "Yes";

  return (
    <section className="panel">
      <div className="readiness-intro">
        <h2>Are you ready to request a QDRO?</h2>
        <p>Please fill out this checklist to see if we can proceed with your request.</p>
      </div>
      <span className="status warn">Readiness checklist</span>
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
      <section className="choice readiness-gate">
        <input type="checkbox" checked={isIraScreeningComplete(data)} readOnly aria-label="IRA screening complete" />
        <div className="readiness-gate-content">
          <fieldset className="field">
            <legend>Are you trying to divide an IRA?</legend>
            <div className="choice-row readiness-radio-row">
              {["Yes", "No"].map((option) => (
                <label className="choice readiness-radio-choice" key={option}>
                  <input
                    type="radio"
                    name="ai-readiness-is-ira"
                    checked={data.is_ira === option}
                    onChange={() => {
                      updateField("is_ira", option);
                      updateField("ira_admin_confirmed", "");
                    }}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {isIra && (
            <>
              <div className="readiness-warning">
                <p>{iraWarning}</p>
              </div>
              <fieldset className="field">
                <legend>Have you spoken to the plan administrator and confirmed that they require a QDRO be drafted?</legend>
                <div className="choice-row readiness-radio-row">
                  {["Yes", "No"].map((option) => (
                    <label className="choice readiness-radio-choice" key={option}>
                      <input
                        type="radio"
                        name="ai-readiness-ira-admin-confirmed"
                        checked={data.ira_admin_confirmed === option}
                        onChange={() => updateField("ira_admin_confirmed", option)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {isIra && !administratorConfirmed && <small>Confirm administrator requirements before continuing.</small>}
            </>
          )}
        </div>
      </section>
      <div className="toolbar">
        <button className="button primary" type="button" disabled={!readyComplete} onClick={onContinue}>
          Continue to account setup
        </button>
      </div>
    </section>
  );
}

function AccountStep({
  accountEmail,
  accountMode,
  accountPassword,
  clientUser,
  isWorking,
  onContinue,
  onSubmit,
  setAccountEmail,
  setAccountMode,
  setAccountPassword
}: {
  accountEmail: string;
  accountMode: "create" | "sign-in";
  accountPassword: string;
  clientUser: User | null;
  isWorking: boolean;
  onContinue: () => void;
  onSubmit: () => void;
  setAccountEmail: (value: string) => void;
  setAccountMode: (value: "create" | "sign-in") => void;
  setAccountPassword: (value: string) => void;
}) {
  if (clientUser) {
    return (
      <section className="panel">
        <span className="status info">Account ready</span>
        <p>Signed in as {clientUser.email}. Uploaded documents and the submitted request will be tied to this account.</p>
        <div className="toolbar">
          <button className="button primary" type="button" onClick={onContinue}>
            Continue to uploads
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel account-setup-panel">
      <span className="status info">{accountMode === "create" ? "Create account" : "Sign in"}</span>
      <p>This is required before upload so the documents can be permanently stored with the request.</p>
      <div className="field-grid one">
        <div className="field">
          <label htmlFor="ai-account-email">Email</label>
          <input className="input" id="ai-account-email" type="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="ai-account-password">Password</label>
          <input className="input" id="ai-account-password" type="password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} />
        </div>
      </div>
      <div className="toolbar">
        <button className="button primary" type="button" onClick={onSubmit} disabled={isWorking || !accountEmail || !accountPassword}>
          {isWorking ? "Working..." : accountMode === "create" ? "Create account and continue" : "Sign in and continue"}
        </button>
        <button
          className="button ghost"
          type="button"
          onClick={() => setAccountMode(accountMode === "create" ? "sign-in" : "create")}
        >
          {accountMode === "create" ? "Sign in instead" : "Create account instead"}
        </button>
      </div>
    </section>
  );
}

function UploadStep({
  files,
  isExtracting,
  isWorking,
  onDeleteFile,
  onFilesSelected,
  onRunExtraction
}: {
  files: AiUploadedFile[];
  isExtracting: boolean;
  isWorking: boolean;
  onDeleteFile: (file: AiUploadedFile) => void;
  onFilesSelected: (kind: AiUploadedFile["kind"], files: FileList | null) => void;
  onRunExtraction: () => void;
}) {
  return (
    <section className="panel">
      <span className="status info">Upload & extract</span>
      <div className="ai-upload-grid">
        <UploadBox label="Signed divorce decree" kind="decree" onFilesSelected={onFilesSelected} />
        <UploadBox label="Retirement account statement" kind="statement" onFilesSelected={onFilesSelected} />
        <UploadBox label="Additional documents" kind="other" onFilesSelected={onFilesSelected} multiple />
      </div>
      {files.length > 0 && (
        <div className="ai-file-list">
          {files.map((file) => (
            <article className="mini-check" key={file.id}>
              <span className="icon">✓</span>
              <span className="ai-file-summary">
                <strong>{file.name}</strong>
                <small>{file.kind} · {formatFileSize(file.size)}</small>
              </span>
              <button
                className="button secondary compact-action"
                type="button"
                disabled={isWorking}
                onClick={() => onDeleteFile(file)}
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
      {isExtracting && <DocumentScanAnimation />}
      <div className="toolbar">
        <button className="button primary" type="button" disabled={isWorking || !files.length} onClick={onRunExtraction}>
          {isExtracting ? "Reviewing documents..." : "Extract answers from documents"}
        </button>
      </div>
    </section>
  );
}

function DocumentScanAnimation() {
  return (
    <div className="document-scan" role="status" aria-live="polite">
      <div className="document-scan-page" aria-hidden="true">
        <div className="document-scan-fold" />
        <div className="document-scan-seal">QDRO</div>
        <div className="document-scan-title" />
        <div className="document-scan-line wide" />
        <div className="document-scan-line" />
        <div className="document-scan-line medium" />
        <div className="document-scan-signature" />
        <div className="document-scan-beam" />
      </div>
      <div>
        <strong>Scanning uploaded documents</strong>
        <p>Reading decree details, party information, and retirement plan terms.</p>
      </div>
    </div>
  );
}

function UploadBox({
  label,
  kind,
  multiple,
  onFilesSelected
}: {
  label: string;
  kind: AiUploadedFile["kind"];
  multiple?: boolean;
  onFilesSelected: (kind: AiUploadedFile["kind"], files: FileList | null) => void;
}) {
  return (
    <div className="field ai-upload-box">
      <label htmlFor={`ai-upload-${kind}`}>{label}</label>
      <small>PDF, Word, JPG, or PNG.</small>
      <input
        className="input"
        id={`ai-upload-${kind}`}
        type="file"
        multiple={multiple}
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        onChange={(event) => onFilesSelected(kind, event.target.files)}
      />
    </div>
  );
}

function MissingQuestionsStep({
  data,
  extraction,
  missingFields,
  onBack,
  onContinue,
  updateField
}: {
  data: WizardData;
  extraction: AiExtractionResult;
  missingFields: IntakeField[];
  onBack: () => void;
  onContinue: () => void;
  updateField: (id: string, value: string | boolean) => void;
}) {
  const [shownFieldIds, setShownFieldIds] = useState(() => missingFields.map((field) => field.id));

  useEffect(() => {
    setShownFieldIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const field of missingFields) {
        if (!next.has(field.id)) {
          next.add(field.id);
          changed = true;
        }
      }
      return changed ? Array.from(next) : current;
    });
  }, [missingFields]);

  const displayFields = shownFieldIds
    .map((fieldId) => aiIntakeFieldMap.get(fieldId))
    .filter((field): field is IntakeField => Boolean(field && isAiFieldVisible(field, data)));

  return (
    <section className="panel">
      <span className={displayFields.length ? "status warn" : "status info"}>{displayFields.length ? "Questions needed" : "Required questions complete"}</span>
      {displayFields.length > 0 && (
        <p>
          Your documents covered most of what we need. Please answer a few more details that are still missing.
        </p>
      )}
      {displayFields.length > 0 ? (
        <MissingQuestionGroups fields={displayFields} data={data} updateField={updateField} showStepDescriptions={false} />
      ) : (
        <p>AI found enough to complete the required fields. Review everything before sending it to admin.</p>
      )}
      <div className="toolbar">
        <button className="button secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button primary" type="button" onClick={onContinue}>
          Continue to confirmation
        </button>
      </div>
    </section>
  );
}

function MissingQuestionGroups({
  fields,
  data,
  showStepDescriptions = true,
  updateField
}: {
  fields: IntakeField[];
  data: WizardData;
  showStepDescriptions?: boolean;
  updateField: (id: string, value: string | boolean) => void;
}) {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));

  return (
    <div className="admin-intake-sections ai-question-groups">
      {intakeSteps.filter((step) => step.id !== "uploads").map((step) => {
        const stepFields = step.fields.filter((field) => fieldsById.has(field.id));
        if (!stepFields.length) return null;

        return (
          <section className="admin-intake-step" key={step.id}>
            <div>
              <span className="status info">{step.title}</span>
              {showStepDescriptions && step.description && <p>{step.description}</p>}
            </div>
            {step.id === "parties" ? (
              <AiPartyFieldGroups fields={stepFields} data={data} updateField={updateField} />
            ) : (
              <div className="field-grid">
                {stepFields.map((field) => (
                  <AiFieldControl data={data} field={field} key={field.id} onChange={(value) => updateField(field.id, value)} value={data[field.id]} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function AiPartyFieldGroups({
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
  const party1Name = getPartyDisplayName(data.party1_name);
  const party2Name = getPartyDisplayName(data.party2_name);
  const requesterHint = getRequesterRoleHint(data);

  return (
    <div className="party-field-groups">
      {remainingFields.length > 0 && (
        <>
          <div className="field-grid">
            {remainingFields.map((field) => (
              <AiFieldControl data={data} field={field} key={field.id} onChange={(value) => updateField(field.id, value)} value={data[field.id]} />
            ))}
          </div>
          {requesterHint && <p className="field-guidance">{requesterHint}</p>}
        </>
      )}
      {party1Fields.length > 0 && (
        <section className="party-field-group">
          <div className="party-field-group-head">
            <span className="status info">Party 1{party1Name ? `: ${party1Name}` : ""}</span>
          </div>
          <div className="field-grid">
            {party1Fields.map((field) => (
              <AiFieldControl data={data} field={field} key={field.id} onChange={(value) => updateField(field.id, value)} value={data[field.id]} />
            ))}
          </div>
        </section>
      )}
      {party2Fields.length > 0 && (
        <section className="party-field-group party-field-group-secondary">
          <div className="party-field-group-head">
            <span className="status info">Party 2{party2Name ? `: ${party2Name}` : ""}</span>
          </div>
          <div className="field-grid">
            {party2Fields.map((field) => (
              <AiFieldControl data={data} field={field} key={field.id} onChange={(value) => updateField(field.id, value)} value={data[field.id]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ConfirmStep({
  data,
  extraction,
  isWorking,
  onBack,
  onSubmit,
  updateField
}: {
  data: WizardData;
  extraction: AiExtractionResult;
  isWorking: boolean;
  onBack: () => void;
  onSubmit: () => void;
  updateField: (id: string, value: string | boolean) => void;
}) {
  const confirmFields = intakeSteps
    .filter((step) => step.id !== "uploads")
    .flatMap((step) => step.fields)
    .filter((field) => isAiFieldVisible(field, data) && (field.required || hasWizardFieldValue(data[field.id])));

  return (
    <section className="panel">
      <span className="status info">Confirm everything</span>
      {extraction.fields.length > 0 && (
        <div className="ai-confidence-list">
          {extraction.fields.map((field) => (
            <ConfidenceRow field={field} key={field.id} />
          ))}
        </div>
      )}
      <MissingQuestionGroups fields={confirmFields} data={data} updateField={updateField} />
      <div className="toolbar">
        <button className="button secondary" type="button" onClick={onBack}>
          Back
        </button>
        <button className="button primary" type="button" onClick={onSubmit} disabled={isWorking}>
          {isWorking ? "Submitting..." : "Submit to admin review"}
        </button>
      </div>
    </section>
  );
}

function AiFieldControl({
  data,
  field,
  value,
  onChange
}: {
  data: WizardData;
  field: IntakeField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  const inputId = `ai-field-${field.id}`;
  const label = aiFieldLabelOverrides[field.id] || field.label;
  const isSsnField = isSsnFieldId(field.id);
  const isPhoneField = field.type === "phone";
  const rawValue = typeof value === "boolean" ? String(value) : String(value || "");
  const stringValue = isSsnField
    ? formatSsnInput(rawValue)
    : isPhoneField
      ? formatPhoneInput(rawValue)
      : field.type === "date"
        ? normalizeAiFieldValue(field, rawValue)
        : rawValue;
  const fieldClassName = ["field", field.fullWidth ? "full-field" : "", field.constrained ? "constrained-field" : ""].filter(Boolean).join(" ");

  if (field.type === "radio") {
    return (
      <fieldset className={`${fieldClassName} full-field radio-field`}>
        <legend>{label}</legend>
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
      <div className={fieldClassName}>
        <label htmlFor={inputId}>{label}</label>
        <select className="select" id={inputId} value={stringValue} onChange={(event) => onChange(event.target.value)}>
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
        <label htmlFor={inputId}>{label}</label>
        <textarea className="textarea" id={inputId} value={stringValue} onChange={(event) => onChange(event.target.value)} />
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
      <label htmlFor={inputId}>{label}</label>
      {field.help && <small>{field.help}</small>}
      <input
        className="input"
        id={inputId}
        type={type}
        inputMode={isSsnField || isPhoneField ? "numeric" : undefined}
        pattern={isSsnField || isPhoneField ? "[0-9() -]*" : undefined}
        maxLength={isSsnField ? 11 : isPhoneField ? 14 : undefined}
        value={stringValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(isSsnField ? formatSsnInput(event.target.value) : isPhoneField ? formatPhoneInput(event.target.value) : event.target.value)}
      />
    </div>
  );
}

function ConfidenceRow({ field }: { field: AiExtractedField }) {
  const valueText = field.value || (field.confidence === "missing" ? "Not found in the uploaded documents" : "");
  const detailText =
    field.source || field.note
      ? `${field.source || "No source listed"}${field.note ? ` · ${field.note}` : ""}`
      : field.confidence === "missing"
        ? "Please review the fields below."
        : "";

  return (
    <article className="ai-confidence-row">
      <span className={`status ${getConfidenceStatusClass(field.confidence)}`}>{getConfidenceLabel(field.confidence)}</span>
      <div>
        <strong>{humanizeFieldId(field.id)}</strong>
        {valueText && <p>{valueText}</p>}
        {detailText && <small>{detailText}</small>}
      </div>
    </article>
  );
}

const aiFieldLabelOverrides: Record<string, string> = {
  requester_name: "Party Requester Name",
  requester_phone: "Party Requester Phone",
  requester_email: "Party Requester Email"
};

function isIraScreeningComplete(data: WizardData) {
  if (data.is_ira === "No") return true;
  return data.is_ira === "Yes" && data.ira_admin_confirmed === "Yes";
}

function getVisibleQuestionFields(data: WizardData, files: AiUploadedFile[], questionFieldIds: string[], stage: Stage) {
  const currentMissingFields = getMissingAiFieldsForUploads(data, files);
  if (stage !== "missing" || questionFieldIds.length === 0) return currentMissingFields;

  const fieldsById = new Map(currentMissingFields.map((field) => [field.id, field]));
  for (const fieldId of questionFieldIds) {
    const field = aiIntakeFieldMap.get(fieldId);
    if (field && isAiFieldVisible(field, data)) {
      fieldsById.set(field.id, field);
    }
  }

  return Array.from(fieldsById.values());
}

function getMissingAiFieldsForUploads(data: WizardData, files: AiUploadedFile[]) {
  const satisfiedFileFields = new Set<string>();
  if (files.some((file) => file.kind === "decree")) satisfiedFileFields.add("signed_decree");
  if (files.some((file) => file.kind === "statement")) satisfiedFileFields.add("account_statement");

  const fieldsById = new Map(
    getMissingRequiredAiFields(data)
      .filter((field) => !satisfiedFileFields.has(field.id))
      .map((field) => [field.id, field])
  );

  if (data.division_type === "Percentage" && !hasWizardFieldValue(data.percent_award)) {
    const field = aiIntakeFieldMap.get("percent_award");
    if (field) fieldsById.set(field.id, field);
  }

  if (data.division_type === "Fixed amount" && !hasWizardFieldValue(data.fixed_award)) {
    const field = aiIntakeFieldMap.get("fixed_award");
    if (field) fieldsById.set(field.id, field);
  }

  for (const fieldId of getReviewIfBlankFieldIds(data)) {
    const field = aiIntakeFieldMap.get(fieldId);
    if (field && isAiFieldVisible(field, data) && !hasWizardFieldValue(data[field.id])) {
      fieldsById.set(field.id, field);
    }
  }

  return Array.from(fieldsById.values());
}

function getReviewIfBlankFieldIds(data: WizardData) {
  const fieldIds: string[] = [];

  if (!hasCompleteAddress(data, "party1")) {
    fieldIds.push("party1_address_line2");
  }

  if (!hasCompleteAddress(data, "party2")) {
    fieldIds.push("party2_address_line2");
  }

  if (data.has_employer === "Yes") {
    if (!hasCompleteAddress(data, "employer")) {
      fieldIds.push("employer_address_line2");
    }
    fieldIds.push("employer_fax", "employer_email");
  }

  return fieldIds;
}

function hasCompleteAddress(data: WizardData, prefix: "party1" | "party2" | "employer") {
  return ["address_street", "address_city", "address_state", "address_zip"].every((field) =>
    hasWizardFieldValue(data[`${prefix}_${field}`])
  );
}

function hasWizardFieldValue(value: string | boolean | undefined) {
  return typeof value === "boolean" ? true : Boolean(String(value || "").trim());
}

function appendSpecialTerm(current: string | boolean | undefined, detail: string) {
  const currentText = typeof current === "string" ? current.trim() : "";
  if (!currentText) return detail;
  if (currentText.includes(detail)) return currentText;
  return `${currentText}\n${detail}`;
}

function getProgress(stage: Stage, readyComplete: boolean, clientUser: User | null, fileCount: number, missingCount: number) {
  if (stage === "submitted") return 100;
  if (stage === "confirm") return missingCount ? 82 : 92;
  if (stage === "missing") return missingCount ? 68 : 82;
  if (stage === "uploads") return fileCount ? 58 : 45;
  if (stage === "account") return clientUser ? 42 : 30;
  return readyComplete ? 25 : 10;
}

function getConfidenceLabel(confidence: AiFieldConfidence) {
  if (confidence === "found") return "Found";
  if (confidence === "review") return "Needs review";
  return "Missing";
}

function getConfidenceStatusClass(confidence: AiFieldConfidence) {
  if (confidence === "found") return "";
  if (confidence === "review") return "warn";
  return "missing";
}

function humanizeFieldId(id: string) {
  return id.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getPartyDisplayName(value: string | boolean | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
