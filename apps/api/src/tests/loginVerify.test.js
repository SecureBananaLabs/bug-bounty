import test from "node:test";
import assert from "node:assert/strict";

test("Login Password Verification", async (t) => {
  process.env.JWT_SECRET = "test-jwt-secret-123456";
  const { createApp } = await import("../app.js");
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  t.after(() => {
    server.close();
  });

  await t.test("POST /api/auth/login rejects unregistered email", async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "unknown_user@example.com",
        password: "password123"
      })
    });
    assert.equal(response.status, 401);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  await t.test("POST /api/auth/login rejects wrong password", async () => {
    // 1. Register a user
    const email = `user_${Date.now()}@example.com`;
    const regResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "securepassword123",
        fullName: "Test User"
      })
    });
    assert.equal(regResponse.status, 201);

    // 2. Login with wrong password
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "wrongpassword"
      })
    });
    assert.equal(response.status, 401);
    const data = await response.json();
    assert.equal(data.success, false);
  });

  await t.test("POST /api/auth/login permits valid credentials", async () => {
    // 1. Register a user
    const email = `user2_${Date.now()}@example.com`;
    const regResponse = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "securepassword123",
        fullName: "Test User 2"
      })
    });
    assert.equal(regResponse.status, 201);

    // 2. Login with correct password
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password: "securepassword123"
      })
    });
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.email, email);
    assert.ok(data.data.token);
  });
});
