#!/usr/bin/env node
const { loadEnvConfig } = require('@next/env');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const path = require('node:path');
loadEnvConfig(process.cwd());
const write = process.argv.includes('--write');
async function main() {
  initializeApp({ credential: cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n') }), storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET });
  const db = getFirestore();
  const bucket = getStorage().bucket();
  const snapshot = await db.collection('requests').get();
  let moved = 0;
  let removed = 0;
  const oldPaths = new Set();
  for (const request of snapshot.docs) {
    const prefix = `admin/requests/${request.id}/`;
    const changes = new Map();
    for (const file of request.data().files || []) {
      const sourcePath = file.storagePath;
      if (!sourcePath || sourcePath.startsWith(prefix)) continue;
      if (!sourcePath.startsWith('wordpress-imports/requests/')) continue;
      const targetPath = prefix + path.posix.basename(sourcePath);
      const source = bucket.file(sourcePath);
      const [metadata] = await source.getMetadata();
      const target = bucket.file(targetPath);
      const [exists] = await target.exists();
      if (exists) {
        const [existing] = await target.getMetadata();
        if (metadata.md5Hash !== existing.md5Hash || metadata.size !== existing.size) throw new Error('Destination conflict; no overwrite performed.');
      } else if (write) {
        await source.copy(target, { preconditionOpts: { ifGenerationMatch: 0 } });
      }
      if (write) {
        const [copied] = await target.getMetadata();
        if (metadata.md5Hash !== copied.md5Hash || metadata.size !== copied.size) throw new Error('Copy verification failed. Original retained.');
      }
      changes.set(sourcePath, targetPath);
      oldPaths.add(sourcePath);
      moved++;
    }
    if (write && changes.size) {
      await db.runTransaction(async (transaction) => {
        const current = await transaction.get(request.ref);
        const files = (current.data().files || []).map(file => changes.has(file.storagePath) ? { ...file, storagePath: changes.get(file.storagePath) } : file);
        transaction.update(request.ref, { files });
      });
    }
  }
  if (write && oldPaths.size) {
    const current = await db.collection('requests').get();
    const referenced = new Set(current.docs.flatMap(doc => (doc.data().files || []).map(file => file.storagePath)));
    for (const oldPath of oldPaths) {
      if (referenced.has(oldPath)) continue;
      const original = bucket.file(oldPath);
      const [metadata] = await original.getMetadata();
      await original.delete({ ifGenerationMatch: metadata.generation });
      removed++;
    }
  }
  console.log(JSON.stringify({ mode: write ? 'write' : 'dry-run', files: moved, originalsRemoved: removed }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
