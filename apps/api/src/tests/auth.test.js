
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("POST /api/auth/login validates credentials and rejects unauthorized logins", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/auth`;

  try {
    // 1. Invalid login attempt (user does not exist)
    const invalidRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@banana.com",
        password: "WrongPassword123!"
      })
    });
    assert.equal(invalidRes.status, 401);
    const invalidPayload = await invalidRes.json();
    assert.equal(invalidPayload.success, false);
    assert.equal(invalidPayload.message, "Invalid email or password");

    // 2. Register a new valid user
    const registerRes = await fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@banana.com",
        password: "SecretPassword123!",
        role: "freelancer"
      })
    });
    assert.equal(registerRes.status, 201);
    const registerPayload = await registerRes.json();
    assert.equal(registerPayload.success, true);
    assert.equal(registerPayload.data.email, "alice@banana.com");
    assert.equal(registerPayload.data.role, "freelancer");

    // 3. Login with wrong password for existing user -> 401
    const wrongPassRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@banana.com",
        password: "IncorrectPassword999!"
      })
    });
    assert.equal(wrongPassRes.status, 401);

    // 4. Successful login with correct credentials -> 200 + valid token with subject and role
    const validRes = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "alice@banana.com",
        password: "SecretPassword123!"
      })
    });
    assert.equal(validRes.status, 200);
    const validPayload = await validRes.json();
    assert.equal(validPayload.success, true);
    assert.equal(validPayload.data.email, "alice@banana.com");
    assert.equal(validPayload.data.role, "freelancer");
    assert.ok(validPayload.data.token, "Token should be issued");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});
