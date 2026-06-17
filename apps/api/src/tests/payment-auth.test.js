import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

async function withServer(assertions) {
  const server = createApp().listen(0);
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

test("payment creation requires authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "usd" })
    });

    assert.equal(response.status, 401);
  });
});

test("payment creation rejects invalid bearer tokens", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: "Bearer not-a-valid-token",
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 100, currency: "usd" })
    });

    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  });
});

test("payment creation accepts authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const token = signAccessToken({ sub: "usr_test", role: "client" });
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 100, currency: "usd" })
    });

    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 100);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_\d+$/);
  });
});
