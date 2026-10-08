#!/usr/bin/env node

const path = require("path");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldPath } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const replaceExisting = args.has("--replace-existing");
const directOnly = args.has("--direct-only");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 20;
const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
const delayMs = delayMsArg ? Number(delayMsArg.slice("--delay-ms=".length)) : 750;
const timeoutMsArg = process.argv.find((arg) => arg.startsWith("--timeout-ms="));
const timeoutMs = timeoutMsArg ? Number(timeoutMsArg.slice("--timeout-ms=".length)) : 30000;

function initializeFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!projectId || !clientEmail || !privateKey || !storageBucket) {
    throw new Error("Firebase Admin project/client/key/storage bucket env vars are required.");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      storageBucket
    });
  }

  return {
    projectId,
    db: getFirestore(),
    bucket: getStorage().bucket(storageBucket)
  };
}

function isWordPressUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === "utahqdro.com";
  } catch {
    return false;
  }
}

function isDirectWordPressUpload(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "utahqdro.com" && parsed.pathname.includes("/wp-content/");
  } catch {
    return false;
  }
}

function safeFileName(value, fallback) {
  const name = path.basename(value || "") || fallback;
  return name.replace(/[^A-Za-z0-9._-]/g, "-").slice(0, 140) || fallback;
}

function getFileNameFromUrl(url, fallback) {
  try {
    const parsed = new URL(url);
    const downloadPath = parsed.searchParams.get("gf-download") || parsed.pathname;
    return safeFileName(decodeURIComponent(path.basename(downloadPath)), fallback);
  } catch {
    return fallback;
  }
}

function getStoragePath(requestId, file) {
  const kind = file.kind || "other";
  const fileName = safeFileName(file.fileName || getFileNameFromUrl(file.url, `${file.id || "file"}.pdf`), `${file.id || "file"}.pdf`);
  return `wordpress-imports/requests/${requestId}/${kind}/${file.id || "file"}-${fileName}`;
}

async function checkUrl(url) {
  let response = await fetchWithRetry(url, { method: "HEAD", redirect: "follow" });
  if (!response.ok) response = await fetchWithRetry(url, { method: "GET", redirect: "follow", headers: { Range: "bytes=0-0" } });
  return {
    ok: response.ok,
    status: response.status,
    contentType: response.headers.get("content-type") || "",
    contentLength: Number(response.headers.get("content-length") || 0)
  };
}

async function downloadFile(url) {
  const response = await fetchWithRetry(url, { redirect: "follow" });
  if (!response.ok) {
    throw new Error(`download failed with HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType
  };
}

async function fetchWithRetry(url, options, attempts = 4) {
  let lastResponse;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (delayMs > 0) await sleep(delayMs);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      lastResponse = response;
      if (response.status !== 429 && response.status < 500) return response;
    } catch (error) {
      if (attempt === attempts) throw error;
    } finally {
      clearTimeout(timeout);
    }
    await sleep(delayMs * attempt * 2);
  }
  return lastResponse;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getImportedRequests(db) {
  const snapshot = await db
    .collection("requests")
    .orderBy(FieldPath.documentId())
    .startAt("QDRO-WP-")
    .endAt("QDRO-WP-\uf8ff")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function main() {
  const { projectId, db, bucket } = initializeFirebase();
  const requests = await getImportedRequests(db);

  const stats = {
    requests: requests.length,
    fileRefs: 0,
    wordpressUrls: 0,
    alreadyMigrated: 0,
    reachable: 0,
    failedChecks: 0,
    deferred: 0,
    uploaded: 0,
    downloadFailures: 0,
    skippedExisting: 0,
    updatedRequests: 0,
    bytes: 0
  };

  console.log(`mode=${write ? "write" : "dry-run"}`);
  console.log(`replaceExisting=${replaceExisting ? "yes" : "no"}`);
  console.log(`directOnly=${directOnly ? "yes" : "no"}`);
  console.log(`projectId=${projectId}`);
  console.log(`limit=${limit}`);
  console.log(`delayMs=${delayMs}`);
  console.log(`timeoutMs=${timeoutMs}`);

  for (let requestIndex = 0; requestIndex < requests.length; requestIndex += 1) {
    const request = requests[requestIndex];
    console.log(`processingRequest=${requestIndex + 1}/${requests.length}`);
    const files = Array.isArray(request.files) ? request.files : [];
    stats.fileRefs += files.length;
    let changed = false;
    const nextFiles = [];

    for (const file of files) {
      if (file.storagePath && !replaceExisting) {
        stats.alreadyMigrated += 1;
        nextFiles.push(file);
        continue;
      }

      if (!isWordPressUrl(file.url)) {
        nextFiles.push(file);
        continue;
      }

      stats.wordpressUrls += 1;
      if (directOnly && !isDirectWordPressUpload(file.url)) {
        stats.deferred += 1;
        nextFiles.push(file);
        continue;
      }
      const storagePath = getStoragePath(request.id, file);

      if (!write) {
        try {
          const info = await checkUrl(file.url);
          if (info.ok) {
            stats.reachable += 1;
            stats.bytes += info.contentLength || 0;
          } else {
            stats.failedChecks += 1;
          }
        } catch {
          stats.failedChecks += 1;
        }
        nextFiles.push(file);
        continue;
      }

      const storageFile = bucket.file(storagePath);
      const [exists] = await storageFile.exists();
      if (exists && !replaceExisting) {
        stats.skippedExisting += 1;
        nextFiles.push({ ...file, storagePath });
        changed = true;
        continue;
      }

      try {
        const downloaded = await downloadFile(file.url);
        await storageFile.save(downloaded.buffer, {
          contentType: downloaded.contentType,
          resumable: false,
          metadata: {
            metadata: {
              importedFrom: "wordpress",
              requestId: request.id,
              originalFileId: file.id || "",
              originalKind: file.kind || ""
            }
          }
        });

        stats.uploaded += 1;
        stats.bytes += downloaded.buffer.length;
        nextFiles.push({
          ...file,
          fileName: file.fileName || getFileNameFromUrl(file.url, `${file.id || "file"}.pdf`),
          storagePath
        });
        changed = true;
      } catch {
        stats.downloadFailures += 1;
        nextFiles.push(file);
      }
    }

    if (write && changed) {
      await db.collection("requests").doc(request.id).update({ files: nextFiles });
      stats.updatedRequests += 1;
    }
  }

  console.log(`requests=${stats.requests}`);
  console.log(`fileRefs=${stats.fileRefs}`);
  console.log(`wordpressUrls=${stats.wordpressUrls}`);
  console.log(`alreadyMigrated=${stats.alreadyMigrated}`);
  console.log(`reachable=${stats.reachable}`);
  console.log(`failedChecks=${stats.failedChecks}`);
  console.log(`deferred=${stats.deferred}`);
  console.log(`uploaded=${stats.uploaded}`);
  console.log(`downloadFailures=${stats.downloadFailures}`);
  console.log(`skippedExisting=${stats.skippedExisting}`);
  console.log(`updatedRequests=${stats.updatedRequests}`);
  console.log(`approxBytes=${stats.bytes}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
