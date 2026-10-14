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
  "./template-matching": { selectTemplateFromList: () => ({ name: "Matched template" }) },
  "./content": { documentTemplates: [{ family: "URS", active: true, accountTypes: ["401k plan", "Pension"] }, { family: "Principal", active: true, accountTypes: ["401k plan"] }], intakeSteps: [{ fields: [
    { id: "plan_family", options: ["Fidelity", "URS", "Principal", "Other"] },
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
  for (const patch of [{ entity: "Other" }, { accountType: "Unknown" }, { name: "   " }, { administrator: 123 }, { administrator: "a".repeat(301) }, { id: "bad/path" }, { active: "true" }]) {
    assert.equal((await route.put({ ...input, ...patch })).status, 400);
  }
  assert.equal(route.writes.length, 0);
});

test("plans save with a blank or omitted administrator", async () => {
  for (const administrator of ["", "   ", undefined]) {
    const route = setup();
    const response = await route.put({ ...input, administrator });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).plan.administrator, "");
    assert.equal(route.writes[0].administrator, "");
  }
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

test("editing a built-in offering creates a saved record, then updates that record", async () => {
  const route = setup({ exists: false });
  const draft = { ...input, id: "offered-fidelity-401k-plan" };
  const payload = directory.planSavePayload(draft, "");
  assert.equal(Object.hasOwn(payload, "id"), false);
  const response = await route.put(payload);
  assert.equal(response.status, 200);
  const { plan } = await response.json();
  assert.equal(plan.id, "new-plan");
  const update = directory.planSavePayload({ ...plan, notes: "Updated contact" }, plan.id);
  assert.equal(update.id, "new-plan");
  const existing = setup();
  assert.equal((await existing.put(update)).status, 200);
  assert.equal(existing.writes[0].notes, "Updated contact");
});

test("existing offerings appear without saved records and saved details replace their offering", () => {
  const offered = directory.mergeOfferedPlans([]);
  assert.equal(offered.length, 7);
  assert.ok(offered.some((plan) => plan.entity === "URS" && plan.accountType === "Pension"));
  assert.ok(offered.filter((plan) => plan.entity === "Fidelity").every((plan) => plan.administrator.startsWith("Fidelity Investments\n")));
  const savings = offered.find((plan) => plan.entity === "URS" && plan.accountType === "401k plan");
  const pension = offered.find((plan) => plan.entity === "URS" && plan.accountType === "Pension");
  assert.match(savings.administrator, /Defined Contribution Department/);
  assert.match(savings.administrator, /801-366-7720/);
  assert.match(pension.administrator, /Defined Benefit Department/);
  assert.match(pension.administrator, /801-366-7770/);
  for (const plan of [savings, pension]) {
    assert.match(plan.administrator, /84110-1590/);
    assert.match(plan.administrator, /Fax 801-366-7733/);
    assert.match(plan.administrator, /Email dcplans@urs.org/);
  }
  const saved = { ...input, id: "saved", entity: "URS" };
  const merged = directory.mergeOfferedPlans([saved]);
  assert.equal(merged.filter((plan) => plan.entity === "URS" && plan.accountType === "401k plan").length, 1);
  assert.ok(merged.some((plan) => plan.id === saved.id));
});

test("Principal includes supplied contacts and the employer confirmation instruction", () => {
  const principal = directory.mergeOfferedPlans([]).find((plan) => plan.entity === "Principal");
  assert.equal(principal.accountType, "401k plan");
  assert.match(principal.administrator, /Principal Life Insurance Co\./);
  assert.match(principal.administrator, /PO Box 9394\nDes Moines, IA 50306-9394/);
  assert.match(principal.administrator, /800-986-3343/);
  assert.match(principal.administrator, /866-704-3481/);
  assert.match(principal.administrator, /expressemail@principal.com/);
  assert.match(principal.notes, /Always call the employer or Principal/);
  assert.match(principal.notes, /formal plan name/);
  assert.match(principal.notes, /where to send the certified QDRO/);
});

test("Fidelity includes contact details and segregation guidance", () => {
  const fidelity = directory.mergeOfferedPlans([]).find((plan) => plan.entity === "Fidelity");
  assert.match(fidelity.administrator, /QDRO Administration Group/);
  assert.match(fidelity.administrator, /P\.O\. Box 770001\nCincinnati, OH 45277-0066/);
  assert.match(fidelity.administrator, /800-343-0860/);
  assert.match(fidelity.administrator, /877-665-4284/);
  assert.match(fidelity.notes, /June 30, 2025/);
  assert.match(fidelity.notes, /Segregation Date/);
  assert.match(fidelity.notes, /https:\/\/qdro\.fidelity\.com/);
  assert.match(fidelity.notes, /Double-check by phone/);
  const saved = directory.mergeOfferedPlans([{ ...input, id: "saved-fidelity", administrator: "If Fidelity is the administrator:\nFidelity Investments\nCustom contact" }]).find((plan) => plan.id === "saved-fidelity");
  assert.equal(saved.administrator, "Fidelity Investments\nCustom contact");
});

test("DMBA Intermountain aliases appear once and retain saved details and loan instructions", () => {
  const entries = directory.mergeOfferedPlans([
    { ...input, id: "intermountain-1", entity: "DMBA", name: "DMBA Intermountain", notes: "Existing note" },
    { ...input, id: "intermountain-2", entity: "DMBA", name: "DMBA Intermountain 401k Plan", administrator: "", notes: "" }
  ]).filter((plan) => plan.name.startsWith("DMBA Intermountain"));
  assert.equal(entries.length, 1);
  assert.equal(entries[0].name, "DMBA Intermountain");
  assert.equal(entries[0].id, "intermountain-1");
  assert.equal(entries[0].administrator, input.administrator);
  assert.match(entries[0].notes, /Existing note/);
  assert.match(entries[0].notes, /Paragraph 1\.b\./);
});

test("TIAA University of Utah entries merge across account types and dash styles", () => {
  const entries = directory.mergeOfferedPlans([
    { ...input, id: "tiaa-1", entity: "TIAA", name: "TIAA – University of Utah", accountType: "", administrator: "", notes: "First note" },
    { ...input, id: "tiaa-2", entity: "TIAA", name: "TIAA - University of Utah", administrator: "", notes: "Second note" }
  ]).filter((plan) => plan.sourceId === "offered-tiaa-university-of-utah");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].id, "tiaa-2");
  assert.equal(entries[0].accountType, "401k plan");
  assert.match(entries[0].administrator, /QDRO Unit/);
  assert.match(entries[0].notes, /First note/);
  assert.match(entries[0].notes, /Second note/);
});

test("renamed lookup entries preserve their names through save validation and refresh", () => {
  for (const sourceId of ["offered-dmba-intermountain-401k", "offered-tiaa-university-of-utah", "offered-fidelity-401k-plan"]) {
    const payload = directory.planSavePayload({ ...input, id: sourceId, name: "My corrected formal plan name" }, "");
    assert.equal(payload.sourceId, sourceId);
    const stored = directory.validatePlan(payload);
    assert.ok(stored);
    const refreshed = directory.mergeOfferedPlans([{ ...stored, id: "persisted" }]);
    assert.equal(refreshed.find((plan) => plan.id === "persisted").name, payload.name);
    assert.equal(refreshed.some((plan) => plan.id === sourceId), false);
    const again = directory.planSavePayload(refreshed.find((plan) => plan.id === "persisted"), "persisted");
    assert.equal(again.sourceId, sourceId);
  }
});
