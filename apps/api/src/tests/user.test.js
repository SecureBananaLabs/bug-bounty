import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

function startServer() {
  const app = createApp();
  const server = app.listen(0);
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function stopServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/users without auth token returns 401", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test User", email: "test@example.com" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
  } finally {
    await stopServer(server);
  }
});

test("POST /api/users with valid auth token creates user", async () => {
  const server = await startServer();
  const { port } = server.address();

  try {
    const token = signAccessToken({ sub: "user_1", role: "admin" });
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: "Test User", email: "test@example.com" }),
    });
    const payload = await response.json();

    assert.equal(response.status, 201);
    assert.equal(payload.success, true);
    assert.ok(payload.data.id);
    assert.equal(payload.data.name, "Test User");
    assert.equal(payload.data.email, "test@example.com");
  } finally {
    await stopServer(server);
  }
});
