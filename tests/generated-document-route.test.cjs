const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function setup({ allowed = true, exists = true, failSave = false } = {}) {
  const calls = { generated: [], uploads: [], updates: [], deleted: [] };
  const ref = {
    get: async () => ({ exists, id: "request-123", data: () => ({ fields: { party1_name: "Saved name" }, templateFamily: "Fidelity" }) }),
    update: async (update) => { calls.updates.push(update); if (failSave) throw new Error("Database unavailable"); }
  };
  const db = { collection: (name) => name === "requests" ? { doc: () => ref } : { get: async () => ({ docs: [] }) } };
  const mocks = {
    "@/lib/admin-api": { requireAdminRequest: async () => allowed ? { ok: true, uid: "admin", db } :
      { ok: false, response: new Response(JSON.stringify({ message: "Admin sign-in is required." }), { status: 401 }) } },
    "@/lib/firebase-admin": { getAdminStorageBucket: () => ({ file: (storagePath) => ({
      save: async (buffer, options) => calls.uploads.push({ storagePath, buffer, options }),
      delete: async () => calls.deleted.push(storagePath)
    }) }) },
    "@/lib/content": { documentTemplates: [] },
    "@/lib/generated-documents": {
      generatedDocumentLabels: { qdro: "QDRO Draft", appearance: "Appearance of Counsel", withdrawal: "Withdrawal of Counsel", addendum: "Addendum" },
      renderGeneratedDocumentHtml: (request, type) => { calls.generated.push({ request, type }); return "<p>Filled document</p>"; },
      generateDocumentFile: async (html, format) => Buffer.from(format === "pdf" ? "%PDF-test" : "{\\rtf1 test}")
    },
    "firebase-admin/firestore": { FieldValue: { arrayUnion: (file) => ({ arrayUnion: file }) } }
  };
  const filename = path.join(__dirname, "../app/api/admin/generated-document/route.ts");
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const route = new Module(filename, module);
  route.filename = filename;
  route.paths = module.paths;
  route.require = (name) => mocks[name] || require(name);
  route._compile(compiled, filename);
  return { calls, post: (body) => route.exports.POST(new Request("http://localhost/api/admin/generated-document", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
  })) };
}

const input = { requestId: "request-123", documentType: "qdro", format: "pdf", fields: { party1_name: "Unsaved preview name" } };

test("attachment requires admin access", async () => {
  const { post, calls } = setup({ allowed: false });
  assert.equal((await post(input)).status, 401);
  assert.equal(calls.uploads.length, 0);
});

test("invalid formats and missing requests never create files", async () => {
  const { post, calls } = setup();
  assert.equal((await post({ ...input, format: "html" })).status, 400);
  assert.equal((await post({ ...input, requestId: "bad/path" })).status, 400);
  assert.equal(calls.uploads.length, 0);
  assert.equal((await setup({ exists: false }).post(input)).status, 404);
});

for (const format of ["pdf", "rtf"]) {
  test(`${format} attachments use preview values and append atomically`, async () => {
    const { post, calls } = setup();
    const response = await post({ ...input, format });
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(calls.generated[0].request.fields.party1_name, "Unsaved preview name");
    assert.equal(result.file.kind, "generated");
    assert.ok(result.file.fileName.endsWith(`.${format}`));
    assert.equal(calls.updates[0].files.arrayUnion.id, result.file.id);
    assert.equal(calls.uploads[0].options.contentType, format === "pdf" ? "application/pdf" : "application/rtf");
    assert.ok(!Object.hasOwn(calls.updates[0], "fields"));
  });
}

test("failed attachment records clean up the generated storage file", async () => {
  const { post, calls } = setup({ failSave: true });
  assert.equal((await post(input)).status, 500);
  assert.deepEqual(calls.deleted, [calls.uploads[0].storagePath]);
});
