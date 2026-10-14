import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/payments validates amount and currency", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/payments`;

  await t.test("rejects missing amount", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    assert.equal(response.status, 400);
  });

  await t.test("rejects negative amount", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: -25, currency: "usd" })
    });
    assert.equal(response.status, 400);
  });

  await t.test("rejects wrong-type amount", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: "free", currency: "usd" })
    });
    assert.equal(response.status, 400);
  });

  await t.test("rejects unsupported currency", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "beep" })
    });
    assert.equal(response.status, 400);
  });

  await t.test("accepts valid amount with default currency", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100 })
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.amount, 100);
  });

  await t.test("accepts valid amount with explicit supported currency", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 50, currency: "eur" })
    });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.data.currency, "eur");
    assert.equal(payload.data.amount, 50);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
