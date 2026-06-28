import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, payload) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

test("POST /api/payments accepts a valid payment payload", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 125,
      currency: "usd",
      jobId: "job-101"
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});

test("POST /api/payments rejects missing and non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const missingAmount = await postPayment(baseUrl, {
      currency: "usd",
      jobId: "job-101"
    });
    const missingPayload = await missingAmount.json();

    assert.equal(missingAmount.status, 400);
    assert.equal(missingPayload.success, false);
    assert.equal(missingPayload.message, "Invalid payment request");
    assert.ok(missingPayload.issues.some((issue) => issue.path.includes("amount")));

    const negativeAmount = await postPayment(baseUrl, {
      amount: -1,
      currency: "usd",
      jobId: "job-101"
    });
    const negativePayload = await negativeAmount.json();

    assert.equal(negativeAmount.status, 400);
    assert.equal(negativePayload.success, false);
    assert.ok(negativePayload.issues.some((issue) => issue.path.includes("amount")));
  });
});

test("POST /api/payments rejects caller-supplied system fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 125,
      currency: "usd",
      jobId: "job-101",
      paymentId: "pay_attacker",
      provider: "manual"
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.ok(payload.issues.some((issue) => issue.code === "unrecognized_keys"));
  });
});
