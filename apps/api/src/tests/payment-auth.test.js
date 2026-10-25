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
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments requires auth and allows authenticated requests", async () => {
  await withServer(async (baseUrl) => {
    const unauthenticated = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 2500, currency: "eur" })
    });

    assert.equal(unauthenticated.status, 401);

    const token = signAccessToken({ sub: "usr_payment", role: "client" });
    const authenticated = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ amount: 2500, currency: "eur" })
    });
    const payload = await authenticated.json();

    assert.equal(authenticated.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2500);
    assert.equal(payload.data.currency, "eur");
    assert.equal(payload.data.provider, "stripe");
  });
});
