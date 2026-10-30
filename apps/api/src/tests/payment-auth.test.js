import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import test from "node:test";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { signAccessToken } from "../utils/jwt.js";

async function withApi(run) {
  const server = createApp().listen(0);

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

async function createPayment(baseUrl, token) {
  const headers = { "content-type": "application/json" };
  if (token !== undefined) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({ amount: 1250, currency: "usd" }),
  });

  return { response, body: await response.json() };
}

test("payment creation rejects a missing bearer token", async () => {
  await withApi(async (baseUrl) => {
    const { response, body } = await createPayment(baseUrl);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Unauthorized" });
  });
});

test("payment creation rejects a forged bearer token", async () => {
  const forged = jwt.sign(
    { sub: "usr_attacker", role: "client" },
    randomBytes(32).toString("hex"),
    { expiresIn: "15m" }
  );

  await withApi(async (baseUrl) => {
    const { response, body } = await createPayment(baseUrl, forged);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("payment creation rejects an expired bearer token", async () => {
  const expired = jwt.sign(
    { sub: "usr_expired", role: "client" },
    env.jwtSecret,
    { expiresIn: -1 }
  );

  await withApi(async (baseUrl) => {
    const { response, body } = await createPayment(baseUrl, expired);

    assert.equal(response.status, 401);
    assert.deepEqual(body, { success: false, message: "Invalid token" });
  });
});

test("payment creation preserves existing behavior for an authenticated user", async () => {
  const valid = signAccessToken({ sub: "usr_client", role: "client" });

  await withApi(async (baseUrl) => {
    const { response, body } = await createPayment(baseUrl, valid);

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.match(body.data.paymentId, /^pay_\d+$/);
    assert.equal(body.data.amount, 1250);
    assert.equal(body.data.currency, "usd");
    assert.equal(body.data.provider, "stripe");
  });
});
