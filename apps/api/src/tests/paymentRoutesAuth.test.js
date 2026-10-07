import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

test("payment routes reject callers without a bearer token", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount: 250 })
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { success: false, message: "Unauthorized" });
  } finally {
    await close(server);
  }
});

test("payment routes reject a malformed bearer token", async () => {
  const app = createApp();
  const server = await listen(app);
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/payments`, {
      method: "POST",
      headers: { authorization: "Bearer not-a-jwt", "content-type": "application/json" },
      body: JSON.stringify({ amount: 250 })
    });
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { success: false, message: "Invalid token" });
  } finally {
    await close(server);
  }
});

test("payment routes serve an authenticated caller", async () => {
  const app = createApp();
  const server = await listen(app);
  const token = signAccessToken({ sub: "usr_1", role: "client" });
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}/api/payments`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ amount: 250, currency: "usd" })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.amount, 250);
    assert.equal(body.data.currency, "usd");
  } finally {
    await close(server);
  }
});
