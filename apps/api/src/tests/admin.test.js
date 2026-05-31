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

test("admin role-based access control tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("GET /api/admin/metrics fails without authentication token", async () => {
    const response = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(response.status, 401);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  await t.test("GET /api/admin/metrics fails with client token", async () => {
    const token = signAccessToken({ id: "user_123", email: "client@example.com", role: "client" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics fails with freelancer token", async () => {
    const token = signAccessToken({ id: "user_123", email: "freelancer@example.com", role: "freelancer" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    assert.equal(response.status, 403);
    const payload = await response.json();
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Forbidden");
  });

  await t.test("GET /api/admin/metrics succeeds with admin token", async () => {
    const token = signAccessToken({ id: "admin_123", email: "admin@example.com", role: "admin" });
    const response = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.ok(payload.data.openJobs !== undefined);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
