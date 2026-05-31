import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Tests for issue #1758: registerUser signs token with a different generated user id
 *
 * The registerUser service previously generated two separate Date.now() IDs:
 * one for the response id and another for the JWT sub claim. If the two calls
 * landed on different milliseconds, the token subject would not match the user id.
 *
 * This test verifies that the returned user id matches the token subject.
 */

test("POST /api/auth/register returns matching id and token subject", async () => {
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
        email: "test-id-match@example.com",
        password: "securepassword123"
      })
    });

    assert.equal(response.status, 201, "Registration should succeed");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");

    const userId = body.data.id;
    const token = body.data.token;

    // Decode the token to check the subject
    const decoded = jwt.verify(token, env.jwtSecret);
    assert.equal(decoded.sub, userId, "Token subject must match user id (no ID drift)");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/register token subject is not a different generated id", async () => {
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
        email: "test-no-drift@example.com",
        password: "securepassword123"
      })
    });

    const body = await response.json();
    const userId = body.data.id;
    const decoded = jwt.verify(body.data.token, env.jwtSecret);

    // The sub must start with "usr_" and exactly match the id
    assert.ok(decoded.sub.startsWith("usr_"), "Token subject should be a user ID");
    assert.equal(decoded.sub, userId, "Token subject must not drift from user id");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/register uses safe default role (not client-controlled)", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    // Attempt to register with admin role
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test-role-safety@example.com",
        password: "securepassword123",
        role: "admin"
      })
    });

    const body = await response.json();

    // Even if the schema allows the role field, the service should use DEFAULT_ROLE
    if (body.success) {
      const decoded = jwt.verify(body.data.token, env.jwtSecret);
      assert.equal(decoded.role, "client", "Service must not allow client-controlled role assignment");
      assert.equal(body.data.role, "client", "Response role must be the safe default");
    }
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
