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
    return await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => {
      server.close(() => resolve());
    });
  }
}

function post(base, body, token) {
  return fetch(`${base}/api/payments`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments requires a bearer token", async () => {
  await withServer(async (base) => {
    const response = await post(base, { amount: 25 });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });
});

test("POST /api/payments creates an intent for a valid payload", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_payer" });
    const response = await post(base, { amount: 2500 }, token);
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2500);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments rejects a non-positive amount", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_payer" });
    const response = await post(base, { amount: -500, currency: "usd" }, token);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "amount must be valid");
  });
});

test("POST /api/payments rejects a currency that is not three characters", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_payer" });
    const response = await post(base, { amount: 10, currency: "usdollar" }, token);
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.message, "currency must be valid");
  });
});
