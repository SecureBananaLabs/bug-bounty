import test, { describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

describe("POST /api/auth/refresh", () => {
  let server;
  let baseUrl;

  beforeEach(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterEach(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  test("returns 401 Unauthorized when Authorization header is missing", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Unauthorized" });
  });

  test("returns 401 Invalid token when token is invalid", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.token.payload"
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.deepEqual(payload, { success: false, message: "Invalid token" });
  });

  test("returns 200 with refreshed token preserving sub and role for valid Bearer token", async () => {
    const user = { sub: "usr_custom_123", role: "admin" };
    const validToken = signAccessToken(user);

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${validToken}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data?.token);

    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, user.sub);
    assert.equal(decoded.role, user.role);
  });
});
