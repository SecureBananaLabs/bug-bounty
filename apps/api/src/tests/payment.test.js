import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function startServer() {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  return server;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function postPayment(port, body) {
  const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });

  return {
    response,
    payload: await response.json()
  };
}

test("POST /api/payments defaults missing currency to usd", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const { response, payload } = await postPayment(port, { amount: 1200 });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  } finally {
    await closeServer(server);
  }
});

test("POST /api/payments normalizes string currency codes", async () => {
  const server = await startServer();

  try {
    const { port } = server.address();
    const { response, payload } = await postPayment(port, {
      amount: 1200,
      currency: " USD "
    });

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.equal(payload.data.currency, "usd");
  } finally {
    await closeServer(server);
  }
});
