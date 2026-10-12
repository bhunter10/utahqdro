import { NextResponse } from "next/server";
import { isAdminUser } from "@/lib/admin-access";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

type AdminDb = NonNullable<ReturnType<typeof getAdminDb>>;
type AdminAuth = NonNullable<ReturnType<typeof getAdminAuth>>;

export type AdminRequestAuth =
  | { ok: true; uid: string; auth: AdminAuth; db: AdminDb }
  | { ok: false; response: NextResponse<{ message: string }> };

export async function requireAdminRequest(req: Request, unavailableMessage = "Firebase Admin is not configured."): Promise<AdminRequestAuth> {
  const auth = getAdminAuth();
  const db = getAdminDb();
  if (!auth || !db) {
    return {
      ok: false,
      response: NextResponse.json({ message: unavailableMessage }, { status: 503 })
    };
  }

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Admin sign-in is required." }, { status: 401 })
    };
  }

  let decoded;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: getErrorMessage(error, "Admin sign-in is invalid or expired.") },
        { status: 401 }
      )
    };
  }

  try {
    if (await isAdminUser(decoded, db)) {
      return { ok: true, uid: decoded.uid, auth, db };
    }
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: getErrorMessage(error, "Could not check the admin user profile.") },
        { status: 500 }
      )
    };
  }

  return {
    ok: false,
    response: NextResponse.json({ message: "Admin access is required." }, { status: 403 })
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}
