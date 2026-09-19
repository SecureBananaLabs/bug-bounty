import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function listen(app) {
  const server = app.listen(0);
  return new Promise((res, rej) => {
    server.once("listening", () => res(server));
    server.once("error", rej);
  });
}
function close(server) {
  return new Promise((res, rej) => server.close((e) => e ? rej(e) : res()));
}

test("POST /api/payments - rejects unauthenticated requests", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 100, currency: "usd" })
  });
  assert.equal(res.status, 401);
  await close(server);
});

test("POST /api/payments - rejects invalid amount", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const regRes = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "pay@test.com", password: "password1", fullName: "Pay Tester", role: "client" })
  });
  const { data } = await regRes.json();
  const res = await fetch(`http://127.0.0.1:${port}/api/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.token}` },
    body: JSON.stringify({ amount: -50, currency: "usd" })
  });
  assert.ok(res.status === 400 || res.status === 422, `expected 4xx got ${res.status}`);
  await close(server);
});
