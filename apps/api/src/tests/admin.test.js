import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/admin/metrics authentication and role check flow", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/admin/metrics`;

  await t.test("rejects request without authorization header", async () => {
    const response = await fetch(baseUrl);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("rejects request with invalid token", async () => {
    const response = await fetch(baseUrl, {
      headers: {
        "Authorization": "Bearer invalidtokenhere"
      }
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("rejects request with valid token but non-admin role", async () => {
    const token = signAccessToken({ id: "user_123", role: "client" });
    const response = await fetch(baseUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  });

  await t.test("allows request with valid token and admin role", async () => {
    const token = signAccessToken({ id: "admin_123", role: "admin" });
    const response = await fetch(baseUrl, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
