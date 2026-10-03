import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/users without authentication returns 401 Unauthorized", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User",
        role: "client"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("POST /api/users with invalid token returns 401 Invalid token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid.token.payload"
      },
      body: JSON.stringify({
        email: "test@example.com",
        name: "Test User"
      })
    });

    const payload = await response.json();
    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("POST /api/users with valid bearer token passes auth middleware", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve) => server.once("listening", resolve));

  try {
    const { port } = server.address();
    const token = signAccessToken({ id: "user_123", email: "admin@example.com", role: "admin" });

    const response = await fetch(`http://127.0.0.1:${port}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        email: "newuser@example.com",
        name: "New User",
        role: "freelancer"
      })
    });

    // Successfully passes auth middleware (does not return 401)
    assert.notEqual(response.status, 401);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
