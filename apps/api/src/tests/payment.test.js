import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function postPayment(body) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    return { response, payload: await response.json() };
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("payment creation defaults missing currency to usd", async () => {
  const { response, payload } = await postPayment({ amount: 1200 });

  assert.equal(response.status, 201);
  assert.equal(payload.data.currency, "usd");
});

test("payment creation normalizes string currency", async () => {
  const { response, payload } = await postPayment({ amount: 1200, currency: " USD " });

  assert.equal(response.status, 201);
  assert.equal(payload.data.currency, "usd");
});

test("payment creation defaults blank currency to usd", async () => {
  const { response, payload } = await postPayment({ amount: 1200, currency: "  " });

  assert.equal(response.status, 201);
  assert.equal(payload.data.currency, "usd");
});

test("payment creation defaults non-string currency to usd", async () => {
  const { response, payload } = await postPayment({ amount: 1200, currency: ["eur"] });

  assert.equal(response.status, 201);
  assert.equal(payload.data.currency, "usd");
});
