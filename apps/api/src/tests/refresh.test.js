import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("Token Refresh Endpoint", async (t) => {
  const app = createApp();
  const server = app.listen(0, "127.0.0.1");

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  await t.test("POST /api/auth/refresh — rejects request without token", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST"
    });

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
  });

  await t.test("POST /api/auth/refresh — rejects invalid token", async () => {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Authorization": "Bearer invalid.token.here" }
    });

    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.success, false);
  });

  await t.test("POST /api/auth/refresh — issues new token with valid existing token", async () => {
    const validToken = signAccessToken({ sub: "usr_test123", role: "client" });

    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${validToken}` }
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    // Verify the returned token is a valid JWT string
    assert.equal(typeof body.data.token, "string");
    assert.equal(body.data.token.split(".").length, 3);
  });

  // Clean up server
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
