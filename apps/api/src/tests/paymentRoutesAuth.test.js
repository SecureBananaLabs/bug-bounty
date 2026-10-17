import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/payments rejects an anonymous caller", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 1500, currency: "usd" })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Unauthorized" });

  await close(server);
});

test("POST /api/payments creates an intent for a valid bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_11", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ amount: 1500, currency: "eur" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.match(payload.data.paymentId, /^pay_/);
  assert.equal(payload.data.amount, 1500);
  assert.equal(payload.data.currency, "eur");
  assert.equal(payload.data.provider, "stripe");

  await close(server);
});

test("POST /api/payments rejects a malformed bearer token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer not-a-real-token" },
    body: JSON.stringify({ amount: 1500 })
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.deepEqual(payload, { success: false, message: "Invalid token" });

  await close(server);
});
