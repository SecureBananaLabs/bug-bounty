import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import {
  createPaymentIntent,
  PaymentValidationError
} from "../services/paymentService.js";

async function withServer(callback) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("createPaymentIntent accepts positive finite amounts", async () => {
  const payment = await createPaymentIntent({ amount: 25, currency: "eur" });

  assert.equal(payment.amount, 25);
  assert.equal(payment.currency, "eur");
  assert.equal(payment.provider, "stripe");
  assert.match(payment.paymentId, /^pay_/);
});

test("createPaymentIntent rejects invalid amounts", async () => {
  const invalidAmounts = [
    0,
    -1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "10",
    null
  ];

  for (const amount of invalidAmounts) {
    await assert.rejects(
      () => createPaymentIntent({ amount }),
      PaymentValidationError
    );
  }
});

test("POST /api/payments rejects non-positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: -5 })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Payment amount must be a positive number"
    });
  });
});

test("POST /api/payments accepts valid positive amounts", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 49.99, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 49.99);
    assert.equal(payload.data.currency, "usd");
  });
});
