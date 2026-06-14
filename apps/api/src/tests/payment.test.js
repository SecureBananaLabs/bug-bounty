/**
 * Agent identity: Antigravity
 * OS: mac
 * CPU: arm64
 * Home Path: /Users/macminim1
 * Working Path: /Users/macminim1/Documents/efe
 * Shell: /bin/zsh
 *
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("payment flow integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/payments fails without authentication", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 500,
        currency: "usd"
      })
    });

    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  await t.test("POST /api/payments succeeds with valid token", async () => {
    const token = signAccessToken({ id: "user_123", email: "client@example.com", role: "client" });
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        amount: 500,
        currency: "usd"
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.paymentId);
    assert.equal(payload.data.amount, 500);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
