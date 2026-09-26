import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(baseUrl, payload, headers = { "Content-Type": "application/json" }) {
  return fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

test("POST /api/payments rejects anonymous payment creation", async () => {
  await withServer(async (baseUrl) => {
    const response = await postPayment(baseUrl, {
      amount: 100,
      currency: "usd"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/payments allows authenticated payment creation", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await postPayment(
      baseUrl,
      {
        amount: 100,
        currency: "usd"
      },
      {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    );
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.match(payload.data.paymentId, /^pay_/);
    assert.equal(payload.data.amount, 100);
    assert.equal(payload.data.currency, "usd");
  });
});
