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

async function intent(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${signAccessToken({ sub: "usr_9", role: "client" })}`
    },
    body: JSON.stringify(body)
  });

  assert.equal(response.status, 201);
  return (await response.json()).data;
}

test("POST /api/payments normalizes the currency code", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const padded = await intent(port, { amount: 120, currency: "  USD  " });
  assert.equal(padded.currency, "usd");
  assert.equal(padded.amount, 120);

  const upper = await intent(port, { amount: 80, currency: "GBP" });
  assert.equal(upper.currency, "gbp");

  await close(server);
});

test("POST /api/payments falls back to usd for a blank currency", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  for (const currency of ["   ", "", undefined]) {
    const data = await intent(port, { amount: 40, currency });
    assert.equal(data.currency, "usd");
    assert.equal(data.amount, 40);
  }

  const missing = await intent(port, { amount: 55 });
  assert.equal(missing.currency, "usd");

  await close(server);
});
