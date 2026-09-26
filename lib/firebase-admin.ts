import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getConfiguredStorageBucket() {
  return process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "";
}

function initializeAdminApp() {
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY)?.replace(/\\n/g, "\n");
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
