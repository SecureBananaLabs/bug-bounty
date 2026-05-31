import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

/**
 * Tests for issue #1766: user creation accepts empty payloads and client-controlled ids
 *
 * The POST /api/users endpoint should:
 * 1. Require email and name fields
 * 2. Reject unknown fields like 'id' (preventing client-controlled IDs)
 * 3. Only allow safe roles (client, freelancer), not admin
 * 4. Server-generate the ID regardless of any id in the payload
 */

test("POST /api/users with empty body returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 400, "Empty body should return 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/users with missing name returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com" })
    });

    assert.equal(response.status, 400, "Missing name should return 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/users with client-controlled id field returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: "usr_attacker_controlled",
        email: "attacker@evil.com",
        name: "Attacker"
      })
    });

    assert.equal(response.status, 400, "Client-controlled id should be rejected by strict schema");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/users with admin role returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "attacker@evil.com",
        name: "Attacker",
        role: "admin"
      })
    });

    assert.equal(response.status, 400, "Admin role should be rejected");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/users with valid payload returns 201 with server-generated id", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "valid@example.com",
        name: "Valid User",
        role: "freelancer",
        bio: "A test bio"
      })
    });

    assert.equal(response.status, 201, "Valid payload should return 201");

    const body = await response.json();
    assert.equal(body.success, true, "Response should indicate success");
    assert.ok(body.data.id.startsWith("usr_"), "ID should be server-generated");
    assert.equal(body.data.email, "valid@example.com");
    assert.equal(body.data.name, "Valid User");
    assert.equal(body.data.role, "freelancer");
    assert.equal(body.data.bio, "A test bio");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("POST /api/users with invalid email returns 400", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        name: "Test User"
      })
    });

    assert.equal(response.status, 400, "Invalid email should return 400");

    const body = await response.json();
    assert.equal(body.success, false, "Response should indicate failure");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
