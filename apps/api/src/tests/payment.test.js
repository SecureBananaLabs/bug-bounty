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

async function withServer(fn) {
  const server = await listen(createApp());
  try {
    const { port } = server.address();
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    await close(server);
  }
}

test("POST /api/payments rejects unauthenticated requests with 401", async () => {
  await withServer(async (base) => {
    const response = await fetch(`${base}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 100, currency: "usd" })
    });

    assert.equal(response.status, 401);
  });
});

test("POST /api/payments rejects negative amounts with 400", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await fetch(`${base}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: -500, currency: "usd" })
    });

    assert.equal(response.status, 400);
    const payload = await response.json();
    assert.equal(payload.success, false);
  });
});

test("POST /api/payments accepts a valid authenticated payment", async () => {
  await withServer(async (base) => {
    const token = signAccessToken({ sub: "usr_1", role: "client" });
    const response = await fetch(`${base}/api/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 2500, currency: "usd" })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.equal(payload.data.amount, 2500);
    assert.equal(payload.data.currency, "usd");
  });
});
