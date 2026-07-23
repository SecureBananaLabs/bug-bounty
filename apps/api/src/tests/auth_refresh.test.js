import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("Auth refresh endpoint tests", async (t) => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = `http://127.0.0.1:${port}/api/auth/refresh`;

  await t.test("POST /api/auth/refresh without token returns 401 Unauthorized", async () => {
    const response = await fetch(url, {
      method: "POST"
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Unauthorized");
  });

  await t.test("POST /api/auth/refresh with invalid token returns 401", async () => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": "Bearer invalidtokenhere"
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.success, false);
    assert.equal(payload.message, "Invalid token");
  });

  await t.test("POST /api/auth/refresh with valid token returns 200 and preserves user sub and role", async () => {
    const initialToken = signAccessToken({ sub: "usr_custom_123", role: "freelancer" });
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${initialToken}`
      }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.success, true);
    assert.ok(payload.data.token);

    // Verify the refreshed token contains the correct subject and role
    const decoded = verifyAccessToken(payload.data.token);
    assert.equal(decoded.sub, "usr_custom_123");
    assert.equal(decoded.role, "freelancer");
  });

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
