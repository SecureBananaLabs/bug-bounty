import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function startServer(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/users strips unknown fields (mass assignment prevention)", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "testuser",
      email: "test@example.com",
      password: "securepass123",
      role: "admin",
      isAdmin: true,
      balance: 999999,
    }),
  });

  const data = await response.json();

  // Should succeed with only allowed fields
  assert.equal(response.status, 201);
  assert.ok(data.ok);
  assert.ok(data.data.id);

  // Verify stripped fields are NOT present
  assert.equal(data.data.role, undefined);
  assert.equal(data.data.isAdmin, undefined);
  assert.equal(data.data.balance, undefined);

  await closeServer(server);
});

test("POST /api/users rejects missing required fields", async () => {
  const app = createApp();
  const server = await startServer(app);
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "testuser" }),
  });

  assert.equal(response.status, 400);

  await closeServer(server);
});
