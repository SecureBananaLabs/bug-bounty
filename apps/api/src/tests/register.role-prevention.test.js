import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

/**
 * Tests for issue #1823: Admin role self-assignment via registration endpoint
 *
 * These tests verify that the registration endpoint does NOT allow users
 * to set their own role (especially "admin"), preventing privilege escalation.
 */

test("POST /api/auth/register ignores role field and defaults to client", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    // Attempt to register with role: "admin" — this should be rejected
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@evil.com",
        password: "password123",
        role: "admin"
      })
    });

    // With strict schema, the role field should cause a validation error
    assert.equal(response.status, 400, "Registration with role field should be rejected with 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
    assert.ok(body.message.includes("Validation") || body.errors, "Should indicate validation error");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/register succeeds with valid payload (no role)", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "normal@example.com",
        password: "password123"
      })
    });

    assert.equal(response.status, 201, "Valid registration should succeed with 201");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.equal(body.data.role, "client", "New user should always get 'client' role");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/register with role: freelancer is also rejected", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "user@example.com",
        password: "password123",
        role: "freelancer"
      })
    });

    assert.equal(response.status, 400, "Registration with any role field should be rejected");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
