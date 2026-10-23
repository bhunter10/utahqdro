import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
const failure = () => NextResponse.json({ message: "Unable to sign in. Try again or reset your password." }, { status: 401, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const endpoint = process.env.WORDPRESS_MIGRATION_URL;
  const secret = process.env.WORDPRESS_MIGRATION_SECRET;
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!endpoint || !secret || secret.length < 32 || !auth || !db) return failure();
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password) return failure();
    // Bound the body before parsing; never log credentials or upstream responses.
    const reader = request.body?.getReader();
    if (!reader) return failure();
    let body = "";
    let size = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) { await reader.cancel(); return failure(); }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const input = JSON.parse(body);
    const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
    const password = typeof input.password === "string" ? input.password : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || password.length < 6 || password.length > 4096) return failure();

    // Shared across server instances; limit even unknown emails before calling WordPress.
    const rateRef = db.collection("wordpressMigrationAttempts").doc(createHash("sha256").update(email).digest("hex"));
    const allowed = await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(rateRef);
      const previous = snapshot.data();
      const now = Date.now();
      const active = previous && previous.expiresAt > now;
      const count = active ? Number(previous.count) : 0;
      if (count >= 5) return false;
      tx.set(rateRef, { count: count + 1, expiresAt: active ? previous.expiresAt : now + 15 * 60 * 1000 });
      return true;
    });
    if (!allowed) return failure();

    // Never replace a Firebase password, including passwords reset after migration.
    try { await auth.getUserByEmail(email); return failure(); }
    catch (error) { if ((error as { code?: string }).code !== "auth/user-not-found") throw error; }

    const response = await fetch(url, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/json", "X-UtahQDRO-Migration-Secret": secret },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) return failure();
    const legacy = await response.json();
    if (typeof legacy.id !== "string" || !/^[1-9]\d{0,19}$/.test(legacy.id) || legacy.email !== email) return failure();
    const uid = `wordpress-user-${legacy.id}`;
    // createUser atomically rejects UID/email collisions; no existing account is changed.
    await auth.createUser({ uid, email, password, emailVerified: false,
      displayName: typeof legacy.displayName === "string" && legacy.displayName ? legacy.displayName.slice(0, 256) : email });
    await db.collection("users").doc(uid).set({ uid, email,
      displayName: typeof legacy.displayName === "string" && legacy.displayName ? legacy.displayName.slice(0, 256) : email,
      role: "client", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ migrated: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure();
  }
}
