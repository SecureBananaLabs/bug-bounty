import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

let server, baseUrl;

test.before(async () => {
  const app = createApp();
  server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(() => {
  return new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("POST /api/payments rejects zero amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 0 })
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
});

test("POST /api/payments rejects negative amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: -50 })
  });
  assert.equal(res.status, 400);
});

test("POST /api/payments rejects NaN amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: NaN })
  });
  assert.equal(res.status, 400);
});

test("POST /api/payments rejects string amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: "one hundred" })
  });
  assert.equal(res.status, 400);
});

test("POST /api/payments rejects missing amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(res.status, 400);
});

test("POST /api/payments accepts valid positive amount", async () => {
  const res = await fetch(`${baseUrl}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 5000 })
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.amount, 5000);
});
