"use client";

import { useState } from "react";
import Link from "next/link";
import { demoRequest } from "@/lib/content";

export function PortalClient() {
  const [email, setEmail] = useState("client@example.com");
  const [password, setPassword] = useState("demo-password");
  const [signedIn, setSignedIn] = useState(false);

  if (!signedIn) {
    return (
      <main className="page">
        <section className="hero">
          <div>
            <div className="eyebrow">Client portal</div>
            <h1>Sign in to resume your QDRO or check status.</h1>
            <p className="lead">
              Firebase Auth powers full client accounts. This local build uses a
              demo sign-in until Firebase credentials are configured.
            </p>
          </div>
          <form className="hero-panel">
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
              <button className="button primary full" type="button" onClick={() => setSignedIn(true)}>
                Sign in
              </button>
            </div>
            <p>
              New here? <Link className="muted-link" href="/qdro-request">Start your QDRO request</Link>.
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
            <p className="lead">Track status, notes, files, payment, and signatures.</p>
          </div>
          <Link className="button secondary" href="/qdro-request">
            Start another request
          </Link>
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
