"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateProfile, createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { signInWithMigration } from "@/lib/client-sign-in";
import { auth, db, hasFirebaseConfig } from "@/lib/firebase";

export function AccountClient({ mode: initialMode, onSuccess }: { mode: "sign-in" | "create"; onSuccess?: () => void }) {
  const [mode, setMode] = useState(initialMode);
  const Container = onSuccess ? "div" : "main";
  const Heading = onSuccess ? "h2" : "h1";
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const authInProgress = useRef(false);

  useEffect(() => {
    if (!auth) {
      setAuthReady(true);
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      if (user && !authInProgress.current && !onSuccess) router.replace("/portal");
      else setAuthReady(true);
    });
  }, [router, onSuccess]);

  async function handleAuth() {
    if (isSubmitting) return;
    setMessage("");
    if (!hasFirebaseConfig || !auth || !db) {
      setMessage("Firebase is not configured in this environment yet.");
      return;
    }

    if (mode === "create" && !fullName.trim()) {
      setMessage("Please enter your full name.");
      return;
    }

    try {
      setIsSubmitting(true);
      authInProgress.current = true;
      if (mode === "create") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", credential.user.uid), {
          uid: credential.user.uid,
          email: credential.user.email || email,
          displayName: fullName.trim(),
          role: "client",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await updateProfile(credential.user, { displayName: fullName.trim() });
      } else {
        await signInWithMigration(auth, email, password);
      }
      if (onSuccess) onSuccess();
      else router.replace("/portal");
    } catch (error) {
      setMessage(getPortalAuthMessage(error, mode));
    } finally {
      authInProgress.current = false;
      setIsSubmitting(false);
    }
  }

  async function resetPassword() {
    if (!auth || !email.trim()) return;
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("If an account exists for that email, you’ll receive a password reset link.");
    } catch {
      setMessage("Unable to send a reset link. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!authReady) {
    return <Container className={onSuccess ? undefined : "page"} aria-busy="true"><p role="status">Loading your account…</p></Container>;
  }

  return (
    <Container className={onSuccess ? "account-modal-content" : "page"}>
      <section className={onSuccess ? "account-modal-section" : "hero"}>
        {!onSuccess && <div>
          <div className="eyebrow">Client portal</div>
          <Heading>{mode === "create" ? "Create your client account." : "Sign in to resume your QDRO or check status."}</Heading>
          <p className="lead">
            Use your client account to view request status, files, notes,
            payment state, and signature progress.
          </p>
        </div>}
        <form className="hero-panel" onSubmit={(event) => { event.preventDefault(); void handleAuth(); }}>
          <span className="status info" id={onSuccess ? "account-modal-title" : undefined}>{mode === "sign-in" ? "Client sign in" : "Create account"}</span>
          <div className="field-grid one">
          {mode === "create" && (
            <>
              <div className="field">
                <label htmlFor="signup-full-name">Full name</label>
                <input className="input" id="signup-full-name" autoComplete="name" required value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
            </>
          )}
            <div className="field">
              <label htmlFor={onSuccess ? "modal-email" : "email"}>Email</label>
              <input className="input" id={onSuccess ? "modal-email" : "email"} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor={onSuccess ? "modal-password" : "password"}>Password</label>
              <input
                className="input"
                id={onSuccess ? "modal-password" : "password"}
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </div>
          <div className="toolbar">
            <button className="button primary full" type="submit" disabled={isSubmitting || !email || !password || (mode === "create" && !fullName.trim())}>
              {isSubmitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
            </button>
          </div>
          {mode === "sign-in" && (
            <button className="button ghost" type="button" onClick={resetPassword} disabled={isSubmitting || !email.trim()}>
              Forgot password?
            </button>
          )}
          {message && <p style={{ color: "var(--danger)" }}>{message}</p>}
          <p>
            {mode === "sign-in" ? "New here?" : "Already have an account?"}{" "}
            {onSuccess ? (
              <button className="button ghost" type="button" disabled={isSubmitting} onClick={() => {
                setMode(mode === "sign-in" ? "create" : "sign-in");
                setPassword("");
                setMessage("");
              }}>
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </button>
            ) : (
              <Link className="muted-link" href={mode === "sign-in" ? "/create-account" : "/sign-in"}>
                {mode === "sign-in" ? "Create an account" : "Sign in"}
              </Link>
            )}
          </p>
          {!onSuccess && (
            <p>
              Ready to begin? <Link className="muted-link" href="/qdro-request">Start your QDRO request</Link>.
            </p>
          )}
        </form>
      </section>
    </Container>
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
