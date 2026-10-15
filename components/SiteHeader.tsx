"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { navigation } from "@/lib/content";

export function SiteHeader() {
  const [accountState, setAccountState] = useState<"loading" | "signed-in" | "signed-out">("loading");

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
      <nav className="nav" aria-label="Main navigation">
        <Link className="brand" href="/">
          <img
            className="brand-mark"
            src="/utahqdro-mark.png?v=2"
            alt=""
            width={56}
            height={56}
          />
          <span>UtahQDRO</span>
        </Link>
        <div className="nav-links">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          {accountState !== "loading" && (
            <Link className="button secondary" href="/portal">
              {accountState === "signed-in" ? "Client portal" : "Sign in"}
            </Link>
          )}
          <Link className="button primary" href="/qdro-request">
            Start QDRO
          </Link>
        </div>
      </nav>
    </header>
  );
}
