import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/payments", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  await t.test("rejects missing authentication", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1000 })
    });
    assert.equal(response.status, 401);
  });

  await t.test("rejects invalid authentication", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer badtoken"
      },
      body: JSON.stringify({ amount: 1000 })
    });
    assert.equal(response.status, 401);
  });

  await t.test("creates payment intent with valid authentication", async () => {
    const token = signAccessToken({ sub: "usr_123", role: "client" });
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 5000, currency: "eur" })
    });
    assert.equal(response.status, 201);
    
    const payload = await response.json();
    assert.ok(payload.success);
    assert.equal(payload.data.amount, 5000);
    assert.equal(payload.data.currency, "eur");
    assert.ok(payload.data.paymentId.startsWith("pay_"));
  });
});
