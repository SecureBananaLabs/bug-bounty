import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withTestServer(assertions) {
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

test("POST /api/payments rejects unauthenticated requests", async () => {
  await withTestServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 1000, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });
});

test("POST /api/payments accepts valid bearer tokens", async () => {
  await withTestServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_payment", role: "client" });
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 1000, currency: "eur" })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 1000);
    assert.equal(payload.data.currency, "eur");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});
