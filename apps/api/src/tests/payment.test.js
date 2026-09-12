import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

// ─── Helper: start ephemeral server ─────────────────────
async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

// ─── Helper: POST JSON ──────────────────────────────────
async function postPayment(base, body) {
  return fetch(`${base}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

// ─── Tests ───────────────────────────────────────────────

test("POST /api/payments rejects missing amount", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, {});
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /amount/i);
  });
});

test("POST /api/payments rejects negative amount", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, { amount: -10 });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /greater than zero/i);
  });
});

test("POST /api/payments rejects zero amount", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, { amount: 0 });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /greater than zero/i);
  });
});

test("POST /api/payments rejects non-number amount", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, { amount: "fifty" });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /amount/i);
  });
});

test("POST /api/payments rejects unsupported currency", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, { amount: 25, currency: "xyz" });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /unsupported currency/i);
  });
});

test("POST /api/payments rejects amount below Stripe minimum", async () => {
  await withServer(async (base) => {
    const res = await postPayment(base, { amount: 0.10, currency: "usd" });
    const payload = await res.json();
    assert.equal(res.status, 400);
    assert.equal(payload.success, false);
    assert.match(payload.message, /too small/i);
  });
});

test("POST /api/payments creates intent with valid payload (requires STRIPE_SECRET_KEY)", async () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    // Skip integration tests when no key is present
    return;
  }

  await withServer(async (base) => {
    const res = await postPayment(base, { amount: 25, currency: "usd" });
    const payload = await res.json();
    assert.equal(res.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.provider, "stripe");
    assert.ok(payload.data.paymentId.startsWith("pi_"));
    assert.ok(payload.data.clientSecret);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.amount, 2500);
  });
});
