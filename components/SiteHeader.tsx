"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { navigation } from "@/lib/content";
import { AccountModal } from "@/components/AccountModal";

export function SiteHeader() {
  const [accountState, setAccountState] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const [accountEmail, setAccountEmail] = useState("");
  const [showStartRequest, setShowStartRequest] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const accountMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const closeAccountMenu = (event: PointerEvent) => {
      if (!accountMenu.current?.contains(event.target as Node) && accountMenu.current) {
        accountMenu.current.open = false;
      }
    };
    document.addEventListener("pointerdown", closeAccountMenu);
    return () => document.removeEventListener("pointerdown", closeAccountMenu);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!auth) {
      setAccountState("signed-out");
      setShowStartRequest(true);
      return;
    }
    let unsubscribeRequests: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeRequests?.();
      unsubscribeRequests = undefined;
      setAccountState(user ? "signed-in" : "signed-out");
      setAccountEmail(user?.email || "");
      setShowStartRequest(!user);
      if (user && db) {
        unsubscribeRequests = onSnapshot(
          query(collection(db, "requests"), where("ownerUid", "==", user.uid), limit(1)),
          (snapshot) => setShowStartRequest(snapshot.empty),
          () => setShowStartRequest(false)
        );
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeRequests?.();
    };
  }, []);

  async function handleSignOut() {
    if (!auth) return;
    setIsSigningOut(true);
    setSignOutError("");
    try {
      await signOut(auth);
      setMenuOpen(false);
    } catch {
      setSignOutError("Unable to sign out. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="topbar">
      <nav className="nav" aria-label="Main navigation" ref={navRef}>
        <button className="mobile-menu-toggle" type="button" ref={menuButton}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen} aria-controls="header-page-links" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {menuOpen ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
        <Link className="brand" href="/" aria-label="Utah QDRO home" onClick={() => setMenuOpen(false)}>
          <img
            className="brand-mark"
            src="/utah-qdro-mark-v6.png"
            alt=""
            width={88}
            height={88}
          />
          <span>Utah QDRO</span>
        </Link>
        <div className={`nav-links${menuOpen ? " is-open" : ""}`} id="header-page-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          {showStartRequest && (
            <Link className="button primary" href="/qdro-request" onClick={() => setMenuOpen(false)}>
              Start QDRO
            </Link>
          )}
          {accountState === "signed-in" && (
            <span className="nav-account-status desktop-account-control" role="status">
              Signed in
              {accountEmail && (
                <span className="nav-account-email" title={accountEmail}>{accountEmail}</span>
              )}
            </span>
          )}
          {accountState === "signed-in" && (
            <Link className="button secondary desktop-account-control" href="/portal" onClick={() => setMenuOpen(false)}>
              Client portal
            </Link>
          )}
          {accountState === "signed-out" && (
            <button className="button secondary" type="button" aria-haspopup="dialog" onClick={() => {
              setMenuOpen(false);
              setAccountModalOpen(true);
            }}>Sign in</button>
          )}
          {accountState === "signed-in" && (
            <button className="button ghost desktop-account-control" type="button" onClick={handleSignOut} disabled={isSigningOut}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </button>
          )}
          {accountState === "signed-in" && (
            <details className="mobile-account-menu" ref={accountMenu} onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}>
              <summary>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                </svg>
                Account
                <svg className="account-menu-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
              </summary>
              <div className="mobile-account-panel">
                <div className="mobile-account-identity">
                  <span className="mobile-account-label">Signed in</span>
                  {accountEmail && <span className="mobile-account-address">{accountEmail}</span>}
                </div>
                <Link href="/portal" onClick={() => {
                  if (accountMenu.current) accountMenu.current.open = false;
                  setMenuOpen(false);
                }}>Client portal <span aria-hidden="true">→</span></Link>
                <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
                  {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </details>
          )}
        </div>
      </nav>
      {signOutError && <p className="nav-account-error" role="alert">{signOutError}</p>}
      {accountModalOpen && <AccountModal onClose={() => setAccountModalOpen(false)} />}
    </header>
  );
}
