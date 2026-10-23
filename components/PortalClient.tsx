"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import type { QdroRequest } from "@/lib/types";
import { formatLongDate } from "@/lib/field-format";
import { auth, db } from "@/lib/firebase";

export function PortalClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

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
    if (!auth) {
      setAuthReady(true);
      router.replace("/sign-in");
      return;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) router.replace("/sign-in");
      setUser(currentUser);
      setAuthReady(true);
    });
  }, [router]);

  if (!authReady) {
    return <main className="page" aria-busy="true"><p role="status">Loading your account…</p></main>;
  }

  if (!user) {
    return <main className="page" aria-busy="true"><p role="status">Opening sign in…</p></main>;
  }

  return (
    <main className="page">
      <section className="section portal-shell">
        <div className="section-head">
          <div>
            <div className="eyebrow">Client portal</div>
            <h1>Your QDRO request</h1>
          </div>
          <div className="nav-actions">
            <Link className="button primary" href="/qdro-request">
              Start another QDRO request
            </Link>
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
