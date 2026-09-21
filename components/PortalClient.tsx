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
import { doc, setDoc } from "firebase/firestore";
import { demoRequest } from "@/lib/content";
import { auth, db, hasFirebaseConfig } from "@/lib/firebase";

export function PortalClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<"sign-in" | "create">("sign-in");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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
      setMessage(error instanceof Error ? error.message : "Unable to sign in. Please try again.");
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
              Signed in as {user.email}. Track status, notes, files, payment,
              and signatures.
            </p>
          </div>
          <div className="nav-actions">
            <Link className="button secondary" href="/qdro-request">
              Start another request
            </Link>
            <button className="button ghost" type="button" onClick={() => auth && signOut(auth)}>
              Sign out
            </button>
          </div>
        </div>

        <div className="grid three">
          <article className="card">
            <span className="status info">{demoRequest.status}</span>
            <h3 style={{ marginTop: 14 }}>Current status</h3>
            <p>Updated September 21, 2026</p>
          </article>
          <article className="card">
            <span className="status">{demoRequest.paymentState}</span>
            <h3 style={{ marginTop: 14 }}>Payment</h3>
            <p>Stripe payment is recorded before drafting begins.</p>
          </article>
          <article className="card">
            <span className="status warn">{demoRequest.signatureState.replaceAll("_", " ")}</span>
            <h3 style={{ marginTop: 14 }}>Signatures</h3>
            <p>Client signature and later signing milestones appear here once routing starts.</p>
          </article>
        </div>

        <div className="grid two">
          <section className="panel">
            <h2>Client-visible notes</h2>
            {demoRequest.notes
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
              {demoRequest.files.map((file) => (
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
      </section>
    </main>
  );
}
