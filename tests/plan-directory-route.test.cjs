const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function compile(relativePath, mocks = {}) {
  const filename = path.join(__dirname, "..", relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = module.paths;
  loaded.require = (name) => mocks[name] || require(name);
  loaded._compile(compiled, filename);
  return loaded.exports;
}

const directory = compile("lib/plan-directory.ts", {
  "./content": { intakeSteps: [{ fields: [
    { id: "plan_family", options: ["Fidelity", "URS", "Other"] },
    { id: "account_type", options: ["401k plan", "Pension", "Other"] }
  ] }] }
});
const input = { name: "Employer Savings Plan", administrator: "Employer Benefits Committee", entity: "Fidelity", accountType: "401k plan", notes: "", active: true };

function setup({ allowed = true, exists = true, fail = false } = {}) {
  const writes = [];
  let collections = 0;
  const db = { collection: (name) => {
    collections++;
    assert.equal(name, "plans");
    return {
      get: async () => { if (fail) throw new Error("Offline"); return { docs: [{ id: "saved", data: () => input }] }; },
      doc: (id) => ({ id: id || "new-plan", get: async () => ({ exists }), set: async (data) => { if (fail) throw new Error("Offline"); writes.push(data); } })
    };
  } };
  const route = compile("app/api/admin/plans/route.ts", {
    "@/lib/plan-directory": directory,
    "@/lib/admin-api": { requireAdminRequest: async () => allowed ? { ok: true, uid: "admin", db } : { ok: false, response: new Response("{}", { status: 403 }) } }
  });
  return { writes, collections: () => collections, get: () => route.GET(new Request("http://localhost/api/admin/plans")), put: (body) => route.PUT(new Request("http://localhost/api/admin/plans", { method: "PUT", body: JSON.stringify(body) })) };
}

test("unauthorized reads and writes never reach the database", async () => {
  const route = setup({ allowed: false });
  assert.equal((await route.get()).status, 403);
  assert.equal((await route.put(input)).status, 403);
  assert.equal(route.collections(), 0);
});

test("unknown entities, unknown types, empty names, and unsafe IDs are rejected", async () => {
  const route = setup();
  for (const patch of [{ entity: "Other" }, { accountType: "Unknown" }, { name: "   " }, { administrator: "" }, { id: "bad/path" }, { active: "true" }]) {
    assert.equal((await route.put({ ...input, ...patch })).status, 400);
  }
  assert.equal(route.writes.length, 0);
});

test("create and deactivate preserve the administrator separately from provider", async () => {
  const route = setup();
  const created = await (await route.put({ ...input, name: "  Employer Savings Plan  " })).json();
  assert.equal(created.plan.id, "new-plan");
  assert.equal(created.plan.name, input.name);
  assert.equal(route.writes[0].administrator, input.administrator);
  assert.equal(route.writes[0].updatedBy, "admin");
  assert.equal((await route.put({ ...input, id: "saved", active: false })).status, 200);
  assert.equal(route.writes[1].active, false);
});

test("missing plans and storage failures return actionable errors", async () => {
  assert.equal((await setup({ exists: false }).put({ ...input, id: "missing" })).status, 404);
  const route = setup({ fail: true });
  assert.equal((await route.get()).status, 500);
  assert.equal((await route.put(input)).status, 500);
});

test("saved plans can be retrieved", async () => {
  const response = await setup().get();
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).plans, [{ ...input, id: "saved" }]);
});
