import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/users rejects invalid payload", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Missing required fields
  const res1 = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(res1.status, 400);

  // Invalid email
  const res2 = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "not-an-email", password: "12345678" })
  });
  assert.equal(res2.status, 400);

  // Weak password
  const res3 = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@test.com", password: "short" })
  });
  assert.equal(res3.status, 400);

  // Admin role not allowed via this endpoint
  const res4 = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@test.com", password: "12345678", role: "admin" })
  });
  assert.equal(res4.status, 400);

  // Valid payload succeeds
  const res5 = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@test.com", password: "12345678", name: "Test User" })
  });
  assert.equal(res5.status, 201);
  const payload = await res5.json();
  assert.equal(payload.success, true);
  assert.equal(payload.data.email, "user@test.com");
  assert.equal(payload.data.role, "client"); // default role

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
