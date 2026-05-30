import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

/**
 * Tests for issue #1810: Settings/account controls require authentication
 *
 * These tests verify that all settings endpoints require authentication
 * and that dangerous operations (delete account, change password) validate input.
 */

const BASE = (port) => `http://127.0.0.1:${port}/api/settings`;

function makeToken(sub = "usr_test123", role = "client") {
  return signAccessToken({ sub, role });
}

async function withServer(fn) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  try {
    await fn(port);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

// --- Authentication tests ---

test("PUT /api/settings/password without token returns 401", async () => {
  await withServer(async (port) => {
    const res = await fetch(`${BASE(port)}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "oldpassword",
        newPassword: "newpassword1",
        confirmPassword: "newpassword1",
      }),
    });
    assert.equal(res.status, 401, "Should require authentication");
  });
});

test("PUT /api/settings/profile without token returns 401", async () => {
  await withServer(async (port) => {
    const res = await fetch(`${BASE(port)}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: "Test User" }),
    });
    assert.equal(res.status, 401, "Should require authentication");
  });
});

test("DELETE /api/settings/account without token returns 401", async () => {
  await withServer(async (port) => {
    const res = await fetch(`${BASE(port)}/account`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "mypassword1" }),
    });
    assert.equal(res.status, 401, "Should require authentication");
  });
});

// --- Authenticated endpoint tests ---

test("PUT /api/settings/password with valid token returns 200", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: "oldpassword1",
        newPassword: "newpassword12",
        confirmPassword: "newpassword12",
      }),
    });
    assert.equal(res.status, 200, "Authenticated password change should succeed");
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

test("PUT /api/settings/profile with valid token returns 200", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName: "Jane Doe", bio: "Hello world" }),
    });
    assert.equal(res.status, 200, "Authenticated profile update should succeed");
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

test("DELETE /api/settings/account with valid token returns 200", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ password: "mypassword1" }),
    });
    assert.equal(res.status, 200, "Authenticated account deletion should succeed");
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

// --- Validation tests ---

test("PUT /api/settings/password with mismatched confirmation is rejected", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: "oldpassword1",
        newPassword: "newpassword12",
        confirmPassword: "differentpwd1",
      }),
    });
    assert.ok(res.status >= 400, "Mismatched passwords should be rejected");
  });
});

test("DELETE /api/settings/account without password is rejected", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    assert.ok(res.status >= 400, "Delete without password should be rejected");
  });
});

test("PUT /api/settings/password with short password is rejected", async () => {
  await withServer(async (port) => {
    const token = makeToken();
    const res = await fetch(`${BASE(port)}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        currentPassword: "short",
        newPassword: "newpassword12",
        confirmPassword: "newpassword12",
      }),
    });
    assert.ok(res.status >= 400, "Short password should be rejected");
  });
});
