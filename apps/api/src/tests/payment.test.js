import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Payment API Validation Flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/payments with missing amount returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: "usd"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/payments with negative amount returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: -100,
        currency: "usd"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/payments with zero amount returns 400", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 0,
        currency: "usd"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
  });

  await t.test("POST /api/payments with valid data returns 201", async () => {
    const response = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1500,
        currency: "usd"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 1500);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
