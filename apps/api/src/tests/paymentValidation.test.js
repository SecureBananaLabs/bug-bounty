import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { createPaymentSchema, updatePaymentSchema } from "../validators/payment.js";

test("POST /api/payments with valid payload returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const validPayload = {
    amount: 500,
    currency: "USD",
    jobId: "job_98765",
    recipientId: "usr_freelancer_1"
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.amount, 500);
  assert.equal(data.data.currency, "usd");
  assert.equal(data.data.provider, "stripe");
  assert.ok(data.data.paymentId);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments with default currency returns 201", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const validPayload = {
    amount: 150.75
  };

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validPayload)
  });
  const data = await response.json();

  assert.equal(response.status, 201);
  assert.equal(data.success, true);
  assert.equal(data.data.amount, 150.75);
  assert.equal(data.data.currency, "usd");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments rejects non-positive amount with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  for (const invalidAmount of [-50, 0, -0.01]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: invalidAmount })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Validation failed");
    assert.ok(Array.isArray(data.errors));
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments rejects missing amount with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  for (const emptyPayload of [{}, { currency: "usd" }, { jobId: "job_1" }]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emptyPayload)
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Validation failed");
    assert.ok(Array.isArray(data.errors));
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/payments rejects invalid currency with HTTP 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  for (const badCurrency of ["us", "a", "toolongcurrencyname"]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: badCurrency })
    });
    const data = await response.json();

    assert.equal(response.status, 400);
    assert.equal(data.success, false);
    assert.equal(data.message, "Validation failed");
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("createPaymentSchema unit tests - validation and transformations", () => {
  // Valid payloads
  const parsed1 = createPaymentSchema.parse({ amount: 100 });
  assert.equal(parsed1.amount, 100);
  assert.equal(parsed1.currency, "usd");
  assert.equal(parsed1.jobId, undefined);
  assert.equal(parsed1.recipientId, undefined);

  const parsed2 = createPaymentSchema.parse({
    amount: 2500.5,
    currency: "EUR",
    jobId: "job_xyz",
    recipientId: "usr_abc"
  });
  assert.equal(parsed2.amount, 2500.5);
  assert.equal(parsed2.currency, "eur");
  assert.equal(parsed2.jobId, "job_xyz");
  assert.equal(parsed2.recipientId, "usr_abc");

  // Rejections
  assert.throws(() => createPaymentSchema.parse({ amount: -1 }), /positive/i);
  assert.throws(() => createPaymentSchema.parse({ amount: 0 }), /positive/i);
  assert.throws(() => createPaymentSchema.parse({}), /required/i);
  assert.throws(() => createPaymentSchema.parse({ amount: "invalid" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10, currency: "ab" }));
  assert.throws(() => createPaymentSchema.parse({ amount: 10, currency: "waytoolongcurrencystring" }));

  // Partial update schema
  const partial = updatePaymentSchema.parse({ currency: "GBP" });
  assert.equal(partial.currency, "gbp");
  assert.equal(partial.amount, undefined);
});
