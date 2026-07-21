import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { createApp } from "../app.js";

// JWT_SECRET must be set in CI/CD. The fallback here is intentionally
// test-only and must never be used in production (env.js throws in production
// if JWT_SECRET is unset).
const JWT_SECRET = process.env.JWT_SECRET ?? "development-secret";

function makeServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/payments without Authorization header returns 401", async () => {
  const server = await makeServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 1000, currency: "usd" }),
  });

  assert.equal(res.status, 401);

  await closeServer(server);
});

test("POST /api/payments with malformed Bearer token returns 401", async () => {
  const server = await makeServer();
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer not-a-valid-token",
    },
    body: JSON.stringify({ amount: 1000, currency: "usd" }),
  });

  assert.equal(res.status, 401);

  await closeServer(server);
});

test("POST /api/payments with valid Bearer token returns 201", async () => {
  const server = await makeServer();
  const { port } = server.address();

  const token = jwt.sign({ sub: "user_test_123", email: "test@example.com" }, JWT_SECRET, { expiresIn: "15m" });

  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount: 1000, currency: "usd" }),
  });

  assert.equal(res.status, 201);
  const payload = await res.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.paymentId.startsWith("pay_"));
  assert.equal(payload.data.amount, 1000);
  assert.equal(payload.data.currency, "usd");

  await closeServer(server);
});
