import test from "node:test";
import assert from "node:assert/strict";
import { createPayment } from "../controllers/paymentController.js";

function createResponse() {
  return {
    statusCode: null,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function invoke(body) {
  const res = createResponse();
  await createPayment({ body }, res);
  return res;
}

test("creates a valid payment intent and defaults currency to usd", async () => {
  const response = await invoke({
    amount: 125.5,
    jobId: "job_123",
    recipientId: "recipient_456",
    description: "Milestone payment",
    metadata: {
      invoiceId: "invoice_789",
      source: "api",
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.amount, 125.5);
  assert.equal(response.body.data.currency, "usd");
  assert.equal(response.body.data.provider, "stripe");
  assert.match(response.body.data.paymentId, /^pay_\d+$/);
});

test("rejects a missing amount", async () => {
  const response = await invoke({ currency: "usd" });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body.success, false);
  assert.equal(response.body.message, "Invalid payment payload");
  assert.ok(response.body.errors.fieldErrors.amount);
});

for (const amount of [0, -1, -0.01]) {
  test(`rejects non-positive amount: ${amount}`, async () => {
    const response = await invoke({ amount, currency: "usd" });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
    assert.ok(response.body.errors.fieldErrors.amount);
  });
}

test("rejects non-finite and non-numeric amounts", async () => {
  for (const amount of [Infinity, "100", null]) {
    const response = await invoke({ amount, currency: "usd" });

    assert.equal(response.statusCode, 400);
    assert.equal(response.body.success, false);
    assert.ok(response.body.errors.fieldErrors.amount);
  }
});

test("rejects unsupported currencies", async () => {
  const response = await invoke({
    amount: 100,
    currency: "inr",
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.errors.fieldErrors.currency);
});

test("rejects unrecognized properties", async () => {
  const response = await invoke({
    amount: 100,
    currency: "usd",
    privileged: true,
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.ok(
    response.body.errors.formErrors.some((message) =>
      message.includes("Unrecognized key"),
    ),
  );
});

test("rejects oversized bounded fields and invalid metadata values", async () => {
  const response = await invoke({
    amount: 100,
    jobId: "a".repeat(129),
    description: "b".repeat(501),
    metadata: { retryCount: 2 },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.errors.fieldErrors.jobId);
  assert.ok(response.body.errors.fieldErrors.description);
  assert.ok(response.body.errors.fieldErrors.metadata);
});
