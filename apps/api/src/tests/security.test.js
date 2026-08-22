import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/payments without auth returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd" })
  });
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("POST /api/uploads without auth returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/uploads`, {
    method: "POST"
  });
  assert.equal(res.status, 401);

  await new Promise((r) => server.close(r));
});

test("GET /api/search rejects excessively long queries", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const longQuery = "a".repeat(300);
  const res = await fetch(`http://127.0.0.1:${port}/api/search?q=${longQuery}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  // Should return empty results, not crash
  assert.deepEqual(body.data.users, []);
  assert.deepEqual(body.data.jobs, []);
  assert.deepEqual(body.data.freelancers, []);

  await new Promise((r) => server.close(r));
});

test("POST /api/users validates input", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((r) => server.once("listening", r));
  const { port } = server.address();

  const res = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);

  await new Promise((r) => server.close(r));
});
