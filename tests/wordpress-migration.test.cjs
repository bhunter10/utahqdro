const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');

function setup({ existing = false, valid = true, blocked = false, collision = false } = {}) {
  process.env.WORDPRESS_MIGRATION_URL = 'https://legacy.example.com/wp-json/utahqdro-migration/v1/verify';
  process.env.WORDPRESS_MIGRATION_SECRET = 'x'.repeat(32);
  const created = [], profiles = [];
  let calls = 0;
  const auth = {
    getUserByEmail: async () => { if (existing) return { uid: 'existing' }; throw { code: 'auth/user-not-found' }; },
    createUser: async user => { if (collision) throw { code: 'auth/uid-already-exists' }; created.push(user); },
    updateUser: async () => { throw Error('must never update a password'); }
  };
  const db = {
    collection: name => ({ doc: id => ({ name, id, set: async value => profiles.push(value) }) }),
    runTransaction: async fn => fn({
      get: async () => ({ data: () => blocked ? { count: 5, expiresAt: Date.now() + 60000 } : undefined }),
      set: () => {}
    })
  };
  const route = new Module(__filename, module);
  route.paths = module.paths;
  route.require = name => name === '@/lib/firebase-admin'
    ? { getAdminAuth: () => auth, getAdminDb: () => db }
    : require(name);
  route._compile(ts.transpileModule(fs.readFileSync('app/api/auth/wordpress-migrate/route.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText, __filename);
  return {
    created, profiles, calls: () => calls,
    run: async (body = { email: 'Client@Example.com', password: 'old-password' }) => {
      const previous = global.fetch;
      global.fetch = async () => { calls++; return Response.json(valid ? { id: '42', email: 'client@example.com', displayName: 'Client' } : {}, { status: valid ? 200 : 401 }); };
      try { return await route.exports.POST(new Request('https://example.com/api/auth/wordpress-migrate', { method: 'POST', body: JSON.stringify(body) })); }
      finally { global.fetch = previous; }
    }
  };
}
test('verified legacy user gets matching UID and client role without asserting verified email', async () => {
  const s = setup(); assert.equal((await s.run()).status, 200);
  assert.equal(s.created[0].uid, 'wordpress-user-42');
  assert.equal(s.created[0].password, 'old-password');
  assert.equal(s.created[0].emailVerified, false);
  assert.equal(s.profiles[0].role, 'client');
});
for (const [name, options] of [
  ['existing Firebase account', { existing: true }],
  ['bad WordPress password', { valid: false }],
  ['rate limited account', { blocked: true }],
  ['UID collision', { collision: true }]
]) test(name + ' cannot create or overwrite an account', async () => {
  const s = setup(options); assert.equal((await s.run()).status, 401); assert.equal(s.created.length, 0);
  if (options.existing || options.blocked) assert.equal(s.calls(), 0);
});
test('malformed and oversized inputs never reach WordPress', async () => {
  for (const body of [{ email: {}, password: 'password' }, { email: 'client@example.com', password: 'x'.repeat(9000) }]) {
    const s = setup(); assert.equal((await s.run(body)).status, 401); assert.equal(s.calls(), 0);
  }
});
test('unconfigured migration fails closed', async () => {
  const s = setup(); delete process.env.WORDPRESS_MIGRATION_SECRET;
  assert.equal((await s.run()).status, 401); assert.equal(s.calls(), 0);
});
