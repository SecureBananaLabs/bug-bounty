import test from "node:test";
import assert from "node:assert/strict";
import { registerUser } from "../services/authService.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { createApp } from "../app.js";

test("registerUser aligns returned user id and token sub subject", async () => {
  const payload = {
    email: "test.dev@example.com",
    role: "client"
  };

  const result = await registerUser(payload);
  assert.ok(result.id.startsWith("usr_"), "User ID should have prefix usr_");
  assert.equal(result.email, payload.email);
  assert.equal(result.role, payload.role);

  const decoded = verifyAccessToken(result.token);
  assert.equal(decoded.sub, result.id, "JWT sub must match the returned user id");
  assert.equal(decoded.role, payload.role);
});

test("registerUser maintains identical id and token sub when timestamp advances", async () => {
  const realDateNow = Date.now;
  let counter = 1_000_000;

  // Mock Date.now to increment on every call
  Date.now = () => {
    counter += 500;
    return counter;
  };

  try {
    const result = await registerUser({
      email: "timestamp.check@example.com",
      role: "freelancer"
    });

    const decoded = verifyAccessToken(result.token);
    assert.equal(
      decoded.sub,
      result.id,
      "JWT sub must exactly match result.id even if Date.now advances between calls"
    );
  } finally {
    Date.now = realDateNow;
  }
});

test("POST /api/auth/register endpoint returns matching user id and token sub", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: "alice@example.com",
        password: "securePassword123!",
        role: "freelancer"
      })
    });

    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.data.id);
    assert.ok(body.data.token);

    const decoded = verifyAccessToken(body.data.token);
    assert.equal(decoded.sub, body.data.id, "API response token sub must match returned user id");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
