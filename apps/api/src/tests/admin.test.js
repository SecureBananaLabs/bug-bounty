import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("admin routes authorization checks", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/admin/metrics`;

  await t.test("should reject missing token with 401", async () => {
    const response = await fetch(url);
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Unauthorized");
  });

  await t.test("should reject invalid token with 401", async () => {
    const response = await fetch(url, {
      headers: {
        Authorization: "Bearer invalid-token-string"
      }
    });
    assert.equal(response.status, 401);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Invalid token");
  });

  await t.test("should reject client role with 403", async () => {
    const token = signAccessToken({ sub: "usr_client", role: "client" });
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  });

  await t.test("should reject freelancer role with 403", async () => {
    const token = signAccessToken({ sub: "usr_freelancer", role: "freelancer" });
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.success, false);
    assert.equal(body.message, "Forbidden");
  });

  await t.test("should allow admin role with 200", async () => {
    const token = signAccessToken({ sub: "usr_admin", role: "admin" });
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
