import type { DecodedIdToken } from "firebase-admin/auth";
import type { getAdminDb } from "./firebase-admin";

type AdminDb = NonNullable<ReturnType<typeof getAdminDb>>;

const ownerAdminEmails = ["billyhunter@me.com"];

export async function isAdminUser(decoded: DecodedIdToken, db: AdminDb) {
  if (decoded.role === "admin") return true;
  if (decoded.email && getAdminEmails().has(decoded.email.toLowerCase())) return true;

  const profile = await db.collection("users").doc(decoded.uid).get();
  return profile.data()?.role === "admin";
}

function getAdminEmails() {
  return new Set(
    [...ownerAdminEmails, ...(process.env.ADMIN_EMAILS || "").split(",")]
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}
