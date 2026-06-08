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

  try {
    const { port } = server.address();
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function createPaymentPayload() {
  return {
    amount: 125,
    currency: "usd"
  };
}

test("POST /api/payments rejects unauthenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(createPaymentPayload())
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, {
      success: false,
      message: "Unauthorized"
    });
  });
});

test("POST /api/payments accepts authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_payment_author", role: "client" });
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(createPaymentPayload())
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.deepEqual(payload.success, true);
    assert.equal(payload.data.amount, 125);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
