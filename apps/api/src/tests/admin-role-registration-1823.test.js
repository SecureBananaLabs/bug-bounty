import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

/**
 * Tests for issue #1823: Admin role self-assignment via registration endpoint
 *
 * The POST /api/auth/register endpoint should:
 * 1. Reject registration with role="admin" — only "client" and "freelancer" allowed
 * 2. Allow registration with role="client" (default)
 * 3. Allow registration with role="freelancer"
 * 4. The refresh endpoint should accept token from req.body
 */

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

test("POST /api/auth/register with role=admin returns 400", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@evil.com",
        password: "password123",
        role: "admin"
      })
    });

    assert.equal(response.status, 400, "Admin role should be rejected");
    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/register with role=client succeeds (201)", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "client@example.com",
        password: "password123",
        role: "client"
      })
    });

    assert.equal(response.status, 201, "Client role should be accepted");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.equal(body.data.role, "client");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/register with role=freelancer succeeds (201)", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "freelancer@example.com",
        password: "password123",
        role: "freelancer"
      })
    });

    assert.equal(response.status, 201, "Freelancer role should be accepted");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.equal(body.data.role, "freelancer");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/register defaults role to client when omitted", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "default@example.com",
        password: "password123"
      })
    });

    assert.equal(response.status, 201, "Omitted role should default to client");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.equal(body.data.role, "client");
  } finally {
    await close(server);
  }
});

test("POST /api/auth/refresh accepts token in request body", async () => {
  const app = createApp();
  const server = await listen(app);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "some-refresh-token" })
    });

    assert.equal(response.status, 200, "Refresh should accept token from body");
    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.ok(body.data.token, "Should return a new access token");
  } finally {
    await close(server);
  }
});
