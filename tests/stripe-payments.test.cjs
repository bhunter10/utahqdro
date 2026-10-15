const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const Stripe = require('stripe');

function loadRoute(file, mocks, exportName = "POST") {
  const filename = path.resolve(__dirname, '..', file);
  const route = new Module(filename, module);
  route.filename = filename;
  route.paths = module.paths;
  route.require = name => mocks[name] || require(name);
  route._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText, filename);
  return route.exports[exportName];
}

function setup({ state = {}, exists = true, failDb = false, badToken = false } = {}) {
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';
  const records = new Map([['requests/req-1', { ownerUid: 'client', status: 'Payment Pending', paymentState: 'pending', ...state }]]);
  if (!exists) records.delete('requests/req-1');
  const created = [];
  const db = {
    collection: name => ({ doc: id => ({ key: `${name}/${id}`, get: async () => snapshot(`${name}/${id}`) }) }),
    runTransaction: async fn => {
      if (failDb) throw Error('offline');
      await fn({
        get: async ref => snapshot(ref.key),
        set: (ref, value) => records.set(ref.key, value),
        update: (ref, value) => records.set(ref.key, { ...records.get(ref.key), ...value })
      });
    }
  };
  function snapshot(key) { return { exists: records.has(key), data: () => records.get(key) }; }
  const stripe = new Stripe('sk_test_fake');
  stripe.checkout.sessions.create = async input => { created.push(input); return { id: 'cs_test', client_secret: 'cs_test_secret_example' }; };
  const mocks = {
    '@/lib/firebase-admin': { getAdminDb: () => db, getAdminAuth: () => ({ verifyIdToken: async () => {
      if (badToken) throw Error('expired');
      return { uid: 'client' };
    } }) },
    '@/lib/stripe': { getStripe: () => stripe }
  };
  const checkout = loadRoute('app/api/checkout/route.ts', mocks);
  const webhook = loadRoute('app/api/webhooks/stripe/route.ts', mocks);
  return {
    records, created,
    checkout: (body, token = 'token') => checkout(new Request('https://example.com/api/checkout', {
      method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body: JSON.stringify(body)
    })),
    webhook: (event, invalid = false) => {
      const body = JSON.stringify(event);
      const signature = stripe.webhooks.generateTestHeaderString({ payload: body, secret: invalid ? 'wrong' : 'whsec_test' });
      return webhook(new Request('https://example.com/api/webhooks/stripe', {
        method: 'POST', headers: { 'stripe-signature': signature }, body
      }));
    }
  };
}
function event(amount = 55000, overrides = {}, type = 'checkout.session.completed', id = 'cs_test') {
  return { id: `evt_${id}_${type}`, type, data: { object: {
    id, mode: 'payment', metadata: { requestId: 'req-1' }, amount_total: amount,
    currency: 'usd', payment_status: 'paid', payment_intent: 'pi_test', ...overrides
  } } };
}

test('checkout requires a valid login and request ownership', async () => {
  const s = setup();
  assert.equal((await s.checkout({ requestId: 'req-1' }, '')).status, 401);
  assert.equal((await setup({ badToken: true }).checkout({ requestId: 'req-1' })).status, 401);
  assert.equal((await setup({ state: { ownerUid: 'someone-else' } }).checkout({ requestId: 'req-1' })).status, 404);
  assert.equal(s.created.length, 0);
});
test('checkout validates amounts and request IDs', async () => {
  const s = setup();
  for (const body of [{ requestId: '../x' }, { requestId: 'req-1', amountCents: 1 }]) {
    assert.equal((await s.checkout(body)).status, 400);
  }
  assert.equal(s.created.length, 0);
});
test('checkout sends server prices and request references to Stripe', async () => {
  const s = setup();
  for (const amountCents of [27500, 55000]) {
    assert.equal((await s.checkout({ requestId: 'req-1', amountCents })).status, 200);
    const input = s.created.at(-1);
    assert.equal(input.line_items[0].price_data.unit_amount, amountCents);
    assert.equal(input.metadata.requestId, 'req-1');
    assert.equal(input.ui_mode, 'embedded_page');
    assert.equal(input.redirect_on_completion, 'if_required');
    assert.equal(input.return_url, 'https://example.com/portal?payment=returned&request_id=req-1');
    assert.ok(!('success_url' in input));
    assert.ok(!('cancel_url' in input));
    assert.ok(!('payment_method_types' in input));
  }
});
test('checkout blocks settled requests and amounts over the remaining balance', async () => {
  for (const state of [{ paymentState: 'paid' }, { paymentState: 'waived' }, { stripePaidAmountCents: 27500 }]) {
    assert.equal((await setup({ state }).checkout({ requestId: 'req-1', amountCents: 55000 })).status, 409);
  }
});
test('checkout stays unavailable until webhook signing is configured', async () => {
  const s = setup();
  delete process.env.STRIPE_WEBHOOK_SECRET;
  assert.equal((await s.checkout({ requestId: 'req-1' })).status, 503);
  assert.equal(s.created.length, 0);
});
test('webhook rejects forged signatures before writing payments', async () => {
  const s = setup();
  assert.equal((await s.webhook(event(), true)).status, 400);
  assert.equal(s.records.size, 1);
});
test('full payment settles the request once across repeated and distinct events', async () => {
  const s = setup();
  assert.equal((await s.webhook(event())).status, 200);
  await s.webhook(event());
  await s.webhook(event(55000, {}, 'checkout.session.async_payment_succeeded'));
  assert.equal(s.records.get('requests/req-1').stripePaidAmountCents, 55000);
  assert.equal(s.records.get('requests/req-1').status, '2 Paid in Full');
  assert.equal(s.records.size, 3);
});
test('two distinct half payments settle the fee without prematurely marking paid', async () => {
  const s = setup();
  await s.webhook(event(27500));
  assert.equal(s.records.get('requests/req-1').paymentState, 'pending');
  assert.equal(s.records.get('requests/req-1').status, 'Payment Pending');
  await s.webhook(event(27500, {}, 'checkout.session.completed', 'cs_second'));
  assert.equal(s.records.get('requests/req-1').paymentState, 'paid');
  assert.equal(s.records.get('requests/req-1').stripePaidAmountCents, 55000);
});
test('unpaid checkout completion waits for asynchronous success', async () => {
  const s = setup();
  await s.webhook(event(55000, { payment_status: 'unpaid' }));
  assert.equal(s.records.size, 1);
  await s.webhook(event(55000, {}, 'checkout.session.async_payment_succeeded'));
  assert.equal(s.records.get('requests/req-1').paymentState, 'paid');
});
test('failed delayed payment is audited without changing balance or undoing success', async () => {
  const s = setup();
  await s.webhook(event(55000, { payment_status: 'unpaid' }, 'checkout.session.async_payment_failed'));
  assert.equal(s.records.get('stripePayments/cs_test').state, 'failed');
  assert.equal(s.records.get('requests/req-1').stripePaidAmountCents, undefined);
  await s.webhook(event());
  await s.webhook(event(55000, {}, 'checkout.session.async_payment_failed'));
  assert.equal(s.records.get('stripePayments/cs_test').state, 'paid');
});
test('payment confirmation preserves advanced workflow status', async () => {
  const s = setup({ state: { status: '4 Drafted Dave to Review' } });
  await s.webhook(event());
  assert.equal(s.records.get('requests/req-1').status, '4 Drafted Dave to Review');
});
test('bad amounts and currency cannot settle a request', async () => {
  const s = setup();
  assert.equal((await s.webhook(event(1))).status, 400);
  assert.equal((await s.webhook(event(55000, { currency: 'eur' }))).status, 400);
  assert.equal(s.records.size, 1);
});
test('database failures and unknown requests return errors so Stripe retries', async () => {
  assert.equal((await setup({ failDb: true }).webhook(event())).status, 500);
  assert.equal((await setup({ exists: false }).webhook(event())).status, 500);
});


test('admin totals prefer Stripe and preserve imported Square amounts', () => {
  const total = loadRoute('lib/request-payments.ts', {}, 'getRequestTotal');
  assert.equal(total({ stripePaidAmountCents: 27500 }), 275);
  assert.equal(total({ stripePaidAmountCents: 55000 }), 550);
  assert.equal(total({ stripePaidAmountCents: 0, fields: { total: '550' } }), 0);
  assert.equal(total({ paymentState: 'paid', fields: { total: '550' } }), 550);
  assert.equal(total({ fields: { total: '$1,250.50' } }), 1250.5);
  assert.equal(total({ fields: { total: '275' } }), 275);
  assert.equal(total({ fields: { payment_option: 'split' } }), 275);
  assert.equal(total({ fields: { payment_option: 'full' } }), 550);
  assert.equal(total({ fields: { total: '250', payment_option: 'split' } }), 250);
  assert.equal(total({ stripePaidAmountCents: 55000, fields: { payment_option: 'split' } }), 550);
  assert.equal(total({ stripePaidAmountCents: 27500, fields: { total: '550' } }), 275);
  for (const value of ['', ' ', '$', 'unknown', '-100']) assert.equal(total({ fields: { total: value } }), 0);
  assert.equal(total({ paymentState: 'waived', stripePaidAmountCents: 27500 }), 275);
  for (const value of [undefined, null, '55000', NaN, Infinity, -1, 12.5]) {
    assert.equal(total({ stripePaidAmountCents: value }), 0);
  }
});

test('admin requests API carries the Stripe balance through to the displayed total', async () => {
  const stored = [27500, 55000, 0, undefined, -1, '55000'];
  const query = { orderBy: () => query, limit: () => query, get: async () => ({
    docs: stored.map((amount, index) => ({ id: `req-${index}`, data: () => ({
      ownerUid: 'client', stripePaidAmountCents: amount, fields: { total: '999' }
    }) }))
  }) };
  const get = loadRoute('app/api/admin/requests/route.ts', {
    '@/lib/field-format': { normalizePartyNames: fields => fields },
    '@/lib/admin-api': { requireAdminRequest: async () => ({ ok: true, uid: 'admin' }) },
    '@/lib/ai-intake': {},
    '@/lib/firebase-admin': { getAdminDb: () => ({ collection: () => query }) },
    '@/lib/types': { requestStatuses: ['Pending'] }
  }, 'GET');
  const response = await get(new Request('https://example.com/api/admin/requests'));
  assert.equal(response.status, 200);
  const { requests } = await response.json();
  const total = loadRoute('lib/request-payments.ts', {}, 'getRequestTotal');
  assert.deepEqual(requests.map(total), [275, 550, 0, 999, 999, 999]);
  assert.equal(requests[0].stripePaidAmountCents, 27500);
});
