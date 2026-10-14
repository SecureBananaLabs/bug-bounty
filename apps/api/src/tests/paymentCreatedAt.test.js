import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
}

test("POST /api/payments includes server-owned createdAt timestamp", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const before = new Date();
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 250, currency: "usd" })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data.createdAt, "response should include createdAt");

  const created = new Date(body.data.createdAt);
  assert.ok(!isNaN(created.getTime()), "createdAt should be a valid ISO date");

  // server-owned: should be close to now, not from the distant past or future
  const after = new Date();
  assert.ok(created >= before && created <= after, "createdAt should be server-generated");

  await close(server);
});

test("POST /api/payments ignores caller-provided createdAt", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  const fakeDate = "1999-01-01T00:00:00.000Z";
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd", createdAt: fakeDate })
  });
  const body = await res.json();

  assert.equal(res.status, 201);
  assert.ok(body.data.createdAt);
  assert.notEqual(body.data.createdAt, fakeDate, "should not use caller-provided createdAt");

  await close(server);
});
