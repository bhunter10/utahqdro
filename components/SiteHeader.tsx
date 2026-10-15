"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { navigation } from "@/lib/content";

export function SiteHeader() {
  const [accountState, setAccountState] = useState<"loading" | "signed-in" | "signed-out">("loading");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

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
      return;
    }
    return onAuthStateChanged(auth, (user) => {
      setAccountState(user ? "signed-in" : "signed-out");
    });
  }, []);

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
        <Link className="brand" href="/" aria-label="UtahQDRO home" onClick={() => setMenuOpen(false)}>
          <img
            className="brand-mark"
            src="/utahqdro-mark.png?v=2"
            alt=""
            width={56}
            height={56}
          />
          <span>UtahQDRO</span>
        </Link>
        <div className={`nav-links${menuOpen ? " is-open" : ""}`} id="header-page-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          <Link className="button primary" href="/qdro-request" onClick={() => setMenuOpen(false)}>
            Start QDRO
          </Link>
          {accountState !== "loading" && (
            <Link className="button secondary" href="/portal" onClick={() => setMenuOpen(false)}>
              {accountState === "signed-in" ? "Client portal" : "Sign in"}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
