import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Auth API Routes", async (t) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/register - success", async () => {
    const payload = {
      email: "test_user@example.com",
      password: "password123",
      role: "client"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();
    
    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "test_user@example.com");
    assert.equal(body.data.role, "client");
    assert.ok(body.data.token);
  });

  await t.test("POST /api/auth/register - validation failure (short password)", async () => {
    const payload = {
      email: "invalid_user@example.com",
      password: "123",
      role: "client"
    };

    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();
    
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.equal(body.message, "Validation failed");
    assert.ok(body.errors);
  });

  await t.test("POST /api/auth/login - success", async () => {
    const payload = {
      email: "test_user@example.com",
      password: "password123"
    };

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.email, "test_user@example.com");
    assert.ok(body.data.token);
  });

  await t.test("GET /api/auth/oauth/:provider/callback - success", async () => {
    const response = await fetch(`${baseUrl}/api/auth/oauth/github/callback`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.provider, "github");
    assert.equal(body.data.status, "callback-received");
  });

  await t.test("POST /api/auth/refresh - success", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.token);
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
