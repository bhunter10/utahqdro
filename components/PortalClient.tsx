"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import type { QdroRequest } from "@/lib/types";
import { formatLongDate } from "@/lib/field-format";
import { auth, db, hasFirebaseConfig } from "@/lib/firebase";

export function PortalClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [requestState, setRequestState] = useState<{
    uid: string;
    requests: QdroRequest[];
    error?: string;
  } | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const ownedState = requestState?.uid === user?.uid ? requestState : null;
  const requests = ownedState?.requests || [];
  const activeRequest = requests.find((request) => request.id === selectedRequestId) || requests[0];

  useEffect(() => {
    if (!user || !db) return;
    return onSnapshot(
      query(collection(db, "requests"), where("ownerUid", "==", user.uid)),
      (snapshot) => {
        const savedRequests = snapshot.docs.map((entry) => ({ ...entry.data(), id: entry.id }) as QdroRequest);
        savedRequests.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setRequestState({ uid: user.uid, requests: savedRequests });
      },
      () => setRequestState({ uid: user.uid, requests: [], error: "We couldn't load your requests. Please refresh and try again." })
    );
  }, [user]);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
  }, []);

  async function handleAuth() {
    setMessage("");
    if (!hasFirebaseConfig || !auth || !db) {
      setMessage("Firebase is not configured in this environment yet.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === "create") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName: credential.user.email || email,
          role: "client",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setMessage(getPortalAuthMessage(error, mode));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!user) {
    return (
      <main className="page">
        <section className="hero">
          <div>
            <div className="eyebrow">Client portal</div>
            <h1>Sign in to resume your QDRO or check status.</h1>
            <p className="lead">
              Use your client account to view request status, files, notes,
              payment state, and signature progress.
            </p>
          </div>
          <form className="hero-panel">
            <span className="status info">{mode === "sign-in" ? "Client sign in" : "Create account"}</span>
            <div className="field-grid one">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  className="input"
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </div>
            <div className="toolbar">
              <button className="button primary full" type="button" onClick={handleAuth} disabled={isSubmitting || !email || !password}>
                {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
              </button>
            </div>
            {message && <p style={{ color: "var(--danger)" }}>{message}</p>}
            <p>
              {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
              <button
                className="button ghost"
                type="button"
                onClick={() => {
                  setMode((current) => (current === "sign-in" ? "create" : "sign-in"));
                  setMessage("");
                }}
              >
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </button>
            </p>
            <p>
              Ready to begin? <Link className="muted-link" href="/qdro-request">Start your QDRO request</Link>.
            </p>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="section portal-shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">Client portal</div>
            <h1>Your QDRO request</h1>
            <p className="lead">
              Signed in as {user.email}.
            </p>
          </div>
          <div className="nav-actions">
            <Link className="button primary" href="/qdro-request">
              Start another QDRO request
            </Link>
            <button className="button ghost" type="button" onClick={() => auth && signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>

        {!ownedState ? (
          <p role="status">Loading your requests...</p>
        ) : ownedState.error ? (
          <p role="alert">{ownedState.error}</p>
        ) : !activeRequest ? (
          <p>You haven't submitted a request yet.</p>
        ) : (
          <>
            {requests.length > 1 && (
              <div className="field" style={{ marginBottom: 24 }}>
                <label htmlFor="portal-request">Request</label>
                <select className="select" id="portal-request" value={activeRequest.id} onChange={(event) => setSelectedRequestId(event.target.value)}>
                  {requests.map((request) => (
                    <option key={request.id} value={request.id}>
                      {String(request.fields.entity_name || request.templateFamily)} · {formatLongDate(request.createdAt.slice(0, 10))} · {request.id}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid three">
              <article className="card">
                <span className="status info">{activeRequest.status}</span>
                <h3 style={{ marginTop: 14 }}>Current status</h3>
                <p>Updated {formatLongDate(activeRequest.updatedAt.slice(0, 10))}</p>
              </article>
              <article className="card">
                <span className="status">{activeRequest.paymentState}</span>
                <h3 style={{ marginTop: 14 }}>Payment</h3>
                <p>Stripe payment is recorded before drafting begins.</p>
              </article>
              <article className="card">
                <span className="status warn">{activeRequest.signatureState.replaceAll("_", " ")}</span>
                <h3 style={{ marginTop: 14 }}>Signatures</h3>
                <p>Client signature and later signing milestones appear here once routing starts.</p>
              </article>
            </div>

            <div className="grid two">
              <section className="panel">
                <h2>Notes</h2>
                {!activeRequest.notes.some((note) => note.visibility === "client") && <p>No updates yet.</p>}
                {activeRequest.notes
                  .filter((note) => note.visibility === "client")
                  .map((note) => (
                    <article className="card" key={note.id} style={{ marginTop: 12 }}>
                      <strong>{note.author}</strong>
                      <p>{note.body}</p>
                    </article>
                  ))}
              </section>
              <section className="panel">
                <h2>Files</h2>
                <div className="checklist">
                  {activeRequest.files.length === 0 && <p>No files uploaded.</p>}
                  {activeRequest.files.map((file) => (
                    <div className="mini-check" key={file.id}>
                      <span className="icon">✓</span>
                      <div>
                        <strong>{file.label}</strong>
                        <small style={{ display: "block", color: "var(--muted)" }}>
                          {file.fileName} · {file.status}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function getPortalAuthMessage(error: unknown, mode: "sign-in" | "create") {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("auth/invalid-credential") || message.includes("auth/user-not-found") || message.includes("auth/wrong-password")) {
    return "We couldn't find an account with that email and password. Please check both and try again, or create an account if this is your first time here.";
  }

  if (message.includes("auth/email-already-in-use")) {
    return "An account already exists for that email. Please sign in instead.";
  }

  if (message.includes("auth/weak-password")) {
    return "Please choose a stronger password. It should be at least 6 characters.";
  }

  if (message.includes("auth/invalid-email")) {
    return "Please enter a valid email address.";
  }

  if (message.includes("auth/too-many-requests")) {
    return "Too many attempts were made. Please wait a few minutes and try again.";
  }

  return mode === "create" ? "Unable to create your account. Please try again." : "Unable to sign in. Please try again.";
}
