import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, headers = {}) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: JSON.stringify({
      amount: 250,
      currency: "usd"
    })
  });
}

test("POST /api/payments rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments rejects invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      authorization: "Bearer not-a-valid-token"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments allows authenticated payment creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_payment_client", role: "client" });
    const response = await postPayment(baseUrl, {
      authorization: `Bearer ${token}`
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.paymentId, /^pay_\d+$/);
    assert.equal(payload.data.amount, 250);
    assert.equal(payload.data.currency, "usd");
  });
});
