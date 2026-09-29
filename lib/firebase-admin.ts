import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getConfiguredStorageBucket() {
  return process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
}

function unwrapEnvValue(value: string) {
  let next = value.trim();
  const assignmentMatch = next.match(/^(?:FIREBASE_PRIVATE_KEY|GOOGLE_PRIVATE_KEY)\s*=\s*([\s\S]*)$/);
  if (assignmentMatch) {
    next = assignmentMatch[1].trim();
  }

  if ((next.startsWith('"') && next.endsWith('"')) || (next.startsWith("'") && next.endsWith("'"))) {
    next = next.slice(1, -1);
  }

  return next;
}

function getServiceAccountFromPrivateKeyEnv(value?: string) {
  if (!value) return {};

  const unwrapped = unwrapEnvValue(value);
  try {
    const parsed = JSON.parse(unwrapped.replace(/\\"/g, '"'));
    if (parsed && typeof parsed === "object") {
      return {
        clientEmail: typeof parsed.client_email === "string" ? parsed.client_email : "",
        privateKey: typeof parsed.private_key === "string" ? parsed.private_key : ""
      };
    }
  } catch {
    // Not JSON; treat it as the private key itself.
  }

  return { privateKey: unwrapped };
}

function normalizePrivateKey(value?: string) {
  if (!value) return "";

  let privateKey = unwrapEnvValue(value);
  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  return privateKey.replace(/\\n/g, "\n");
}

function initializeAdminApp() {
  const serviceAccountEnv = getServiceAccountFromPrivateKeyEnv(process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY);
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || serviceAccountEnv.clientEmail;
  const privateKey = normalizePrivateKey(serviceAccountEnv.privateKey);
  const storageBucket = getConfiguredStorageBucket();

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey
      }),
      storageBucket
    });
  }

  return getApps()[0];
}

export function getAdminDb() {
  const app = initializeAdminApp();
  if (!app) return null;

  return getFirestore();
}

export function getAdminAuth() {
  const app = initializeAdminApp();
  if (!app) return null;

  return getAuth(app);
}

export function getAdminStorageBucket() {
  const app = initializeAdminApp();
  if (!app) return null;

  const storageBucket = getConfiguredStorageBucket();
  if (!storageBucket) return null;

  return getStorage(app).bucket(storageBucket);
}
