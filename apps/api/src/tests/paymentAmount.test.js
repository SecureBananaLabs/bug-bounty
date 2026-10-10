import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server.address().port));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/payments accepts a positive amount", async () => {
  const server = createApp().listen(0);
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 250, currency: "usd" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.amount, 250);
  assert.equal(payload.data.currency, "usd");

  await close(server);
});

test("POST /api/payments rejects a non-positive amount with 400", async () => {
  const server = createApp().listen(0);
  const port = await listen(server);

  for (const amount of [0, -5, Number.NaN]) {
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount, currency: "usd" })
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "amount must be a positive finite number");
  }

  await close(server);
});
