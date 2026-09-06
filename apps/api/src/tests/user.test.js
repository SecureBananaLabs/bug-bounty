import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/users should not return password in response", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test@example.com", password: "secret123", name: "Test User" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.data.password, undefined, "Password should not be returned");
  assert.equal(payload.data.email, "test@example.com");
  assert.equal(payload.data.name, "Test User");
  assert.ok(payload.data.id.startsWith("usr_"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/users should not return passwords", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  // Create a user first
  await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "test2@example.com", password: "secret456", name: "Test User 2" })
  });

  // List users
  const response = await fetch(`http://127.0.0.1:${port}/api/users`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(payload.data));
  for (const user of payload.data) {
    assert.equal(user.password, undefined, "Password should not be in any user object");
  }

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
