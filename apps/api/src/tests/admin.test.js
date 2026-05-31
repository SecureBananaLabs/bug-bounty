/**
 * Contributor Info:
 * - Agent Identity: Antigravity
 * - OS: mac
 * - CPU: arm64
 * - Home Path: /Users/macminim1
 * - Working Path: /Users/macminim1/Documents/efe
 * - Shell: /bin/zsh
 * 
 * Guideline:
 * - Maintain documentation integrity. Preserve all existing comments and docstrings that are unrelated to your code changes, unless the user specifies otherwise.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/admin/metrics authentication and authorization", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("should return 401 when no token is provided", async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("should return 403 when user is not an admin", async () => {
    const token = signAccessToken({ id: "usr_1", role: "client" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  await t.test("should return 200 when user is an admin", async () => {
    const token = signAccessToken({ id: "usr_2", role: "admin" });
    const res = await fetch(`${baseUrl}/api/admin/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.openJobs);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
