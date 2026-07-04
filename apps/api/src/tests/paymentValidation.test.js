import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("payment payload validation", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  await t.test("POST /api/payments with valid payload", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 1500,
        currency: "usd"
      })
    });
    assert.equal(response.status, 201);
  });

  await t.test("POST /api/payments with negative amount", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: -100,
        currency: "usd"
      })
    });
    assert.equal(response.status, 400);
  });

  await t.test("POST /api/payments with invalid currency code length", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 500,
        currency: "us"
      })
    });
    assert.equal(response.status, 400);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
