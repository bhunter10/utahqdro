#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldPath } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const args = new Set(process.argv.slice(2));
const write = args.has("--write");
const replaceExisting = args.has("--replace-existing");
const directOnly = args.has("--direct-only");
const localOnly = args.has("--local-only");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : 20;
const delayMsArg = process.argv.find((arg) => arg.startsWith("--delay-ms="));
const delayMs = delayMsArg ? Number(delayMsArg.slice("--delay-ms=".length)) : 750;
const timeoutMsArg = process.argv.find((arg) => arg.startsWith("--timeout-ms="));
const timeoutMs = timeoutMsArg ? Number(timeoutMsArg.slice("--timeout-ms=".length)) : 30000;
const localDirArg = process.argv.find((arg) => arg.startsWith("--local-dir="));
const localDir = path.resolve(process.cwd(), localDirArg ? localDirArg.slice("--local-dir=".length) : "private-imports/wordpress-files");

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

function safeDownloadName(value) {
  return String(value || "")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
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

function getWordPressFilePathFromUrl(url) {
  try {
    const parsed = new URL(url);
    const rawPath = parsed.searchParams.get("gf-download") || parsed.pathname;
    const decoded = decodeURIComponent(rawPath).replace(/^\/+/, "");
    return decoded.replace(/^wp-content\/uploads\//, "");
  } catch {
    return "";
  }
}

function getLocalFilePath(url, requestId, file) {
  const generatedPath = path.join(
    process.cwd(),
    "private-imports/generated-pdfs",
    `${requestId}--${safeDownloadName(file.id)}--${safeDownloadName(file.label)}.pdf`
  );
  if (fs.existsSync(generatedPath) && fs.statSync(generatedPath).isFile()) return generatedPath;

  const relativePath = getWordPressFilePathFromUrl(url);
  if (!relativePath) return "";

  const safePath = path.normalize(relativePath).replace(/^(\.\.(\/|\\|$))+/, "");
  const candidate = path.join(localDir, safePath);
  if (candidate.startsWith(localDir) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;

  return "";
}

function getStoragePath(requestId, file) {
  const fileName = safeFileName(file.fileName || getFileNameFromUrl(file.url, `${file.id || "file"}.pdf`), `${file.id || "file"}.pdf`);
  return `admin/requests/${requestId}/${file.id || "file"}-${fileName}`;
}

function removeLegacyUrlWhenMigrated(file) {
  if (!file.storagePath) return file;
  const { url, ...withoutUrl } = file;
  return withoutUrl;
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
  const downloadUrl = getDownloadUrl(url);
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (delayMs > 0) await sleep(delayMs);
      const response = await fetch(downloadUrl, { redirect: "follow", signal: controller.signal });
      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`download failed with HTTP ${response.status}`);
        await sleep(delayMs * attempt * 2);
        continue;
      }
      if (!response.ok) {
        throw new Error(`download failed with HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      const arrayBuffer = await response.arrayBuffer();
      return {
        buffer: Buffer.from(arrayBuffer),
        contentType
      };
    } catch (error) {
      lastError = error;
      if (attempt === 4) break;
      await sleep(delayMs * attempt * 2);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error("download failed");
}

function getDownloadUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "utahqdro.com" && parsed.pathname.startsWith("/pdf/")) {
      parsed.searchParams.set("download", "1");
      return parsed.toString();
    }
  } catch {
    return url;
  }

  return url;
}

function readLocalFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return {
    buffer,
    contentType: getContentType(filePath)
  };
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".doc") return "application/msword";
  if (ext === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  if (ext === ".tif" || ext === ".tiff") return "image/tiff";
  return "application/octet-stream";
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
    localUploaded: 0,
    downloadFailures: 0,
    invalidDownloads: 0,
    missingLocalFiles: 0,
    skippedExisting: 0,
    updatedRequests: 0,
    bytes: 0
  };

  console.log(`mode=${write ? "write" : "dry-run"}`);
  console.log(`replaceExisting=${replaceExisting ? "yes" : "no"}`);
  console.log(`directOnly=${directOnly ? "yes" : "no"}`);
  console.log(`localOnly=${localOnly ? "yes" : "no"}`);
  console.log(`projectId=${projectId}`);
  console.log(`limit=${limit}`);
  console.log(`delayMs=${delayMs}`);
  console.log(`timeoutMs=${timeoutMs}`);
  console.log(`localDirExists=${fs.existsSync(localDir) ? "yes" : "no"}`);

  for (let requestIndex = 0; requestIndex < requests.length; requestIndex += 1) {
    const request = requests[requestIndex];
    console.log(`processingRequest=${requestIndex + 1}/${requests.length}`);
    const files = Array.isArray(request.files) ? request.files : [];
    stats.fileRefs += files.length;
    let changed = false;
    const nextFiles = [];

    for (let fileIndex = 0; fileIndex < files.length; fileIndex += 1) {
      const file = files[fileIndex];
      if (file.storagePath && !replaceExisting) {
        stats.alreadyMigrated += 1;
        const cleanedFile = removeLegacyUrlWhenMigrated(file);
        if (cleanedFile !== file || file.url) changed = true;
        nextFiles.push(cleanedFile);
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
      const localFilePath = getLocalFilePath(file.url, request.id, file);

      if (!write) {
        if (localFilePath) {
          stats.reachable += 1;
          stats.bytes += fs.statSync(localFilePath).size;
        } else if (localOnly) {
          stats.missingLocalFiles += 1;
        } else {
          stats.missingLocalFiles += 1;
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
        }
        nextFiles.push(file);
        continue;
      }

      const storageFile = bucket.file(storagePath);
      const [exists] = await storageFile.exists();
      if (exists && !replaceExisting) {
        stats.skippedExisting += 1;
        const { url, ...withoutUrl } = { ...file, storagePath };
        nextFiles.push(withoutUrl);
        changed = true;
        continue;
      }

      try {
        console.log(`processingFile=${fileIndex + 1}/${files.length}`);
        let downloaded;
        if (localFilePath) {
          downloaded = readLocalFile(localFilePath);
          stats.localUploaded += 1;
        } else if (localOnly) {
          stats.missingLocalFiles += 1;
          nextFiles.push(file);
          continue;
        } else {
          stats.missingLocalFiles += 1;
          downloaded = await downloadFile(file.url);
        }

        if (isBlockedOrInvalidDownload(downloaded, file)) {
          stats.invalidDownloads += 1;
          nextFiles.push(file);
          continue;
        }

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
        const { url, ...withoutUrl } = file;
        nextFiles.push({
          ...withoutUrl,
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
  console.log(`localUploaded=${stats.localUploaded}`);
  console.log(`downloadFailures=${stats.downloadFailures}`);
  console.log(`invalidDownloads=${stats.invalidDownloads}`);
  console.log(`missingLocalFiles=${stats.missingLocalFiles}`);
  console.log(`skippedExisting=${stats.skippedExisting}`);
  console.log(`updatedRequests=${stats.updatedRequests}`);
  console.log(`approxBytes=${stats.bytes}`);
}

function isBlockedOrInvalidDownload(downloaded, file) {
  const contentType = String(downloaded.contentType || "").toLowerCase();
  const head = downloaded.buffer.subarray(0, 256).toString("utf8").trim().toLowerCase();
  const fileName = String(file.fileName || getFileNameFromUrl(file.url, "")).toLowerCase();
  const expectsPdf = fileName.endsWith(".pdf") || String(file.label || "").toLowerCase().includes("pdf:");

  if (contentType.includes("text/html")) return true;
  if (head.startsWith("<!doctype") || head.startsWith("<html")) return true;
  if (expectsPdf && !downloaded.buffer.subarray(0, 5).equals(Buffer.from("%PDF-"))) return true;

  return false;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
