import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentSchema } from "../validators/payment.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function post(base, body) {
  const res = await fetch(`${base}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

test("createPaymentSchema accepts a well-formed payment and defaults the currency", () => {
  const parsed = createPaymentSchema.parse({ amount: 250, jobId: "job_1" });
  assert.equal(parsed.amount, 250);
  assert.equal(parsed.currency, "usd");
  assert.equal(parsed.jobId, "job_1");
});

test("createPaymentSchema rejects non-positive, non-finite and oversized amounts", () => {
  for (const amount of [0, -1, -0.01, NaN, Infinity, 2_000_000]) {
    assert.throws(
      () => createPaymentSchema.parse({ amount, jobId: "job_1" }),
      `amount ${amount} must be rejected`
    );
  }
});

test("createPaymentSchema rejects a non-numeric amount sent as a string", () => {
  assert.throws(() => createPaymentSchema.parse({ amount: "100", jobId: "job_1" }));
  assert.throws(() => createPaymentSchema.parse({ amount: null, jobId: "job_1" }));
  assert.throws(() => createPaymentSchema.parse({ jobId: "job_1" }));
});

test("createPaymentSchema rejects unknown currencies and a missing jobId", () => {
  assert.throws(() => createPaymentSchema.parse({ amount: 10, currency: "btc", jobId: "j" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10, currency: 123, jobId: "j" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10 }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10, jobId: "" }));
});

test("createPaymentSchema rejects unknown keys so extra fields cannot be injected", () => {
  assert.throws(() =>
    createPaymentSchema.parse({ amount: 10, jobId: "j", provider: "attacker", stripeRef: "x" })
  );
});

test("POST /api/payments accepts a valid body and returns 201", async () => {
  await withServer(async (base) => {
    const { status, body } = await post(base, { amount: 120.5, currency: "usd", jobId: "job_abc" });
    assert.equal(status, 201);
    assert.equal(body.data.amount, 120.5);
    assert.equal(body.data.currency, "usd");
  });
});

test("POST /api/payments rejects an arbitrary body instead of forwarding it", async () => {
  await withServer(async (base) => {
    // No amount, no jobId, and injected fields the service must never see.
    const { status, body } = await post(base, { provider: "attacker", stripeRef: "forged" });
    assert.equal(status, 400, "a body with no amount or jobId must be rejected");
    assert.equal(body.data, undefined, "no payment record may be created");
  });
});

test("POST /api/payments rejects a negative amount and never creates an intent", async () => {
  await withServer(async (base) => {
    const { status, body } = await post(base, { amount: -500, jobId: "job_abc" });
    assert.equal(status, 400);
    assert.equal(body.data, undefined);
  });
});

test("POST /api/payments rejects a non-numeric string amount", async () => {
  await withServer(async (base) => {
    const { status } = await post(base, { amount: "100", jobId: "job_abc" });
    assert.equal(status, 400);
  });
});
