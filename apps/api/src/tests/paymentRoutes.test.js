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
  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  return { response, payload: await response.json() };
}

test("POST /api/payments rejects invalid payment amounts", async () => {
  await withServer(async (baseUrl) => {
    for (const amount of [undefined, "100", 0, -1, Number.POSITIVE_INFINITY]) {
      const requestPayload = amount === undefined ? {} : { amount };
      const { response, payload } = await postPayment(baseUrl, requestPayload);

      assert.equal(response.status, 400);
      assert.deepEqual(payload, {
        success: false,
        message: "Invalid payment payload"
      });
    }
  });
});

test("POST /api/payments rejects unsupported currencies", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, {
      amount: 125,
      currency: "eur"
    });

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      success: false,
      message: "Invalid payment payload"
    });
  });
});

test("POST /api/payments creates a payment intent with default USD currency", async () => {
  await withServer(async (baseUrl) => {
    const { response, payload } = await postPayment(baseUrl, { amount: 125 });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
