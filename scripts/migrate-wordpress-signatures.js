#!/usr/bin/env node

const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { FieldPath, getFirestore } = require("firebase-admin/firestore");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const replaceExisting = args.has("--replace-existing");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 100;
const timeoutMsArg = process.argv.find((arg) => arg.startsWith("--timeout-ms="));
const timeoutMs = timeoutMsArg ? Number(timeoutMsArg.slice("--timeout-ms=".length)) : 30000;
const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
const delayMs = delayMsArg ? Number(delayMsArg.slice("--delay-ms=".length)) : 250;

function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin project/client/key env vars are required.");
  }

  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  return { projectId, db: getFirestore() };
}

function isWordPressSignatureUrl(value) {
  if (!value || typeof value !== "string") return false;
  if (value.startsWith("data:image/")) return false;

  try {
    const parsed = new URL(value);
    return parsed.hostname === "utahqdro.com" && parsed.searchParams.has("gf-signature");
  } catch {
    return false;
  }
}

async function getImportedRequests(db) {
  const snapshot = await db
    .collection("requests")
    .orderBy(FieldPath.documentId())
    .startAt("QDRO-WP-")
    .endAt("QDRO-WP-\uf8ff")
    .limit(limit)
    .get();

  return snapshot.docs;
}

async function fetchSignature(url) {
  if (delayMs > 0) await sleep(delayMs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    const buffer = Buffer.from(await response.arrayBuffer());

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (!contentType.toLowerCase().startsWith("image/")) throw new Error("not an image response");
    if (!isImageBuffer(buffer)) throw new Error("invalid image bytes");

    const mimeType = contentType.split(";")[0] || getImageMimeType(buffer);
    return `data:${mimeType};base64,${buffer.toString("base64")}`;
  } finally {
    clearTimeout(timeout);
  }
}

function isImageBuffer(buffer) {
  return Boolean(getImageMimeType(buffer));
}

function getImageMimeType(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (buffer.subarray(0, 3).toString() === "GIF") return "image/gif";
  return "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { projectId, db } = initializeFirebase();
  const docs = await getImportedRequests(db);
  const stats = {
    requests: docs.length,
    candidates: 0,
    alreadyMigrated: 0,
    downloaded: 0,
    failures: 0,
    updated: 0
  };

  console.log(`mode=${write ? "write" : "dry-run"}`);
  console.log(`replaceExisting=${replaceExisting ? "yes" : "no"}`);
  console.log(`projectId=${projectId}`);
  console.log(`limit=${limit}`);
  console.log(`delayMs=${delayMs}`);
  console.log(`timeoutMs=${timeoutMs}`);

  for (let index = 0; index < docs.length; index += 1) {
    const doc = docs[index];
    const data = doc.data();
    const signature = data?.fields?.client_signature;
    console.log(`processingRequest=${index + 1}/${docs.length}`);

    if (typeof signature === "string" && signature.startsWith("data:image/")) {
      stats.alreadyMigrated += 1;
      continue;
    }

    if (!isWordPressSignatureUrl(signature)) continue;
    stats.candidates += 1;

    if (!write) continue;
    if (data?.fields?.client_signature_data_url && !replaceExisting) continue;

    try {
      const dataUrl = await fetchSignature(signature);
      await doc.ref.update({
        "fields.client_signature": dataUrl,
        "fields.wordpress_client_signature_url": signature
      });
      stats.downloaded += 1;
      stats.updated += 1;
    } catch {
      stats.failures += 1;
    }
  }

  console.log(`requests=${stats.requests}`);
  console.log(`candidates=${stats.candidates}`);
  console.log(`alreadyMigrated=${stats.alreadyMigrated}`);
  console.log(`downloaded=${stats.downloaded}`);
  console.log(`failures=${stats.failures}`);
  console.log(`updated=${stats.updated}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
