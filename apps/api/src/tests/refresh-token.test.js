import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * Tests for issue #1750: Refresh endpoint mints tokens without validating refresh token
 *
 * The refresh endpoint should:
 * 1. Require a token in the request body
 * 2. Reject invalid or expired tokens with 401
 * 3. Only issue a new access token for the subject and role in the valid token
 */

test("POST /api/auth/refresh without token returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400, "Missing token should return 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh with no body returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    assert.equal(response.status, 400, "No body should return 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh with invalid token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: "invalid-token-here" })
    });

    assert.equal(response.status, 401, "Invalid token should return 401");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh with valid token returns new token with same subject", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const originalToken = signAccessToken({ sub: "usr_test456", role: "freelancer" });

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: originalToken })
    });

    assert.equal(response.status, 200, "Valid token should return 200");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.ok(body.data.token, "Response should contain a new token");

    // Verify the new token has the same subject and role
    const jwt = (await import("jsonwebtoken")).default;
    const env = (await import("../config/env.js")).env;
    const decoded = jwt.verify(body.data.token, env.jwtSecret);
    assert.equal(decoded.sub, "usr_test456", "New token should preserve subject");
    assert.equal(decoded.role, "freelancer", "New token should preserve role");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/auth/refresh does not mint token for hardcoded usr_existing", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    // Send a valid token for a specific user - verify the new token is for THAT user, not usr_existing
    const originalToken = signAccessToken({ sub: "usr_custom_user", role: "client" });

    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: originalToken })
    });

    const body = await response.json();
    const jwt = (await import("jsonwebtoken")).default;
    const env = (await import("../config/env.js")).env;
    const decoded = jwt.verify(body.data.token, env.jwtSecret);
    assert.equal(decoded.sub, "usr_custom_user", "Should NOT mint token for hardcoded usr_existing");
    assert.notEqual(decoded.sub, "usr_existing", "Should not use hardcoded subject");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
