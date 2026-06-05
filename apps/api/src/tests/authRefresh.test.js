import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh rejects unauthenticated request with 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = "http://127.0.0.1:" + port + "/api/auth/refresh";
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" }
  });

  assert.equal(response.status, 401);
  const payload = await response.json();
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh returns token for authenticated user's subject and role", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const url = "http://127.0.0.1:" + port + "/api/auth/refresh";
  const token = signAccessToken({ sub: "usr_test123", role: "admin" });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer " + token
    }
  });

  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(payload.data.token);

  // Verify the new token has the same sub and role
  const newTokenParts = payload.data.token.split(".");
  assert.equal(newTokenParts.length, 3);
  const decoded = JSON.parse(Buffer.from(newTokenParts[1], "base64url").toString());
  assert.equal(decoded.sub, "usr_test123", "token subject should match authenticated user");
  assert.equal(decoded.role, "admin", "token role should match authenticated user");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
