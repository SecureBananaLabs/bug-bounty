import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    return await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

async function postPayment(port, body) {
  return fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("POST /api/payments rejects missing amount", async () => {
  await withServer(async (port) => {
    const response = await postPayment(port, { currency: "usd" });
    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.ok(Array.isArray(payload.errors));
  });
});

test("POST /api/payments rejects zero amount", async () => {
  await withServer(async (port) => {
    const response = await postPayment(port, { amount: 0, currency: "usd" });
    assert.equal(response.status, 400);
  });
});

test("POST /api/payments rejects negative amount", async () => {
  await withServer(async (port) => {
    const response = await postPayment(port, { amount: -10, currency: "usd" });
    assert.equal(response.status, 400);
  });
});

test("POST /api/payments rejects non-numeric amount", async () => {
  await withServer(async (port) => {
    const response = await postPayment(port, { amount: "free", currency: "usd" });
    assert.equal(response.status, 400);
  });
});

test("POST /api/payments accepts positive amount", async () => {
  await withServer(async (port) => {
    const response = await postPayment(port, { amount: 2599, currency: "usd" });
    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2599);
  });
});
