"use client";

import { signInWithEmailAndPassword, type Auth } from "firebase/auth";

/** Try Firebase first; only an invalid credential can invoke the legacy bridge. */
export async function signInWithMigration(auth: Auth, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    return await signInWithEmailAndPassword(auth, normalizedEmail, password);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (!["auth/invalid-credential", "auth/user-not-found", "auth/wrong-password"].includes(code || "")) throw error;
    const response = await fetch("/api/auth/wordpress-migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    if (!response.ok) throw error;
    return signInWithEmailAndPassword(auth, normalizedEmail, password);
  }
}
