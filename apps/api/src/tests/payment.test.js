import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

async function withServer(assertions) {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    await assertions(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

test("POST /api/payments with valid positive amount returns 201", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 125.5,
        currency: "usd"
      })
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.amount, 125.5);
    assert.equal(data.data.currency, "usd");
  });
});

test("POST /api/payments rejects zero amount", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: 0,
        currency: "usd"
      })
    });

    assert.equal(res.status, 400);
  });
});

test("POST /api/payments rejects negative amount", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: -1,
        currency: "usd"
      })
    });

    assert.equal(res.status, 400);
  });
});

test("POST /api/payments rejects non-numeric amount", async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: "abc",
        currency: "usd"
      })
    });

    assert.equal(res.status, 400);
  });
});
