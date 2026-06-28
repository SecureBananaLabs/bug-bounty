/**
 * Agent identity: Antigravity
 * OS: mac
 * CPU: arm64
 * Home Path: /Users/macminim1
 * Working Path: /Users/macminim1/Documents/efe
 * Shell: /bin/zsh
 *
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("auth flow integration tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/register fails with invalid fields", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "short"
      })
    });

    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unexpected server error");
  });

  await t.test("POST /api/auth/register succeeds with valid fields", async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        role: "client"
      })
    });

    assert.equal(response.status, 201);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.id);
    assert.equal(payload.data.email, "test@example.com");
    assert.ok(payload.data.token);
  });

  await t.test("POST /api/auth/refresh fails without refreshToken in body", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unexpected server error");
  });

  await t.test("POST /api/auth/refresh fails with invalid refresh token", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: "invalid-jwt-token"
      })
    });

    assert.equal(response.status, 500);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unexpected server error");
  });

  await t.test("POST /api/auth/refresh succeeds with valid refresh token", async () => {
    // Sign a mock refresh token containing sub and role
    const refreshToken = signAccessToken({ sub: "usr_123", email: "user@example.com", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refreshToken: refreshToken
      })
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);

    // Verify token content
    const response2 = await fetch(`${baseUrl}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${payload.data.token}`
      },
      body: JSON.stringify({
        title: "Test Job",
        description: "Test description",
        budgetMin: 50,
        budgetMax: 100,
        categoryId: "web",
        skills: ["node"]
      })
    });
    // Valid access token allows job creation
    assert.equal(response2.status, 201);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
