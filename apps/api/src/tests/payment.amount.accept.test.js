import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await run(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  return { response, payload: await response.json() };
}

test("POST /api/payments still creates an intent for a valid positive amount", async () => {
  await withServer(async (port) => {
    const { response, payload } = await postPayment(port, { amount: 2500, currency: "usd" });
    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2500);
    assert.equal(payload.data.currency, "usd");
    assert.equal(payload.data.provider, "stripe");
    assert.match(payload.data.paymentId, /^pay_/);
  });
});

test("POST /api/payments defaults the currency when none is supplied", async () => {
  await withServer(async (port) => {
    const { response, payload } = await postPayment(port, { amount: 10 });
    assert.equal(response.status, 201);
    assert.equal(payload.data.currency, "usd");
  });
});

test("POST /api/payments accepts a small positive fraction", async () => {
  await withServer(async (port) => {
    const { response, payload } = await postPayment(port, { amount: 0.01 });
    assert.equal(response.status, 201);
    assert.equal(payload.data.amount, 0.01);
  });
});
