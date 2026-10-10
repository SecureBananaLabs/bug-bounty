import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh rejects unauthenticated requests", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST"
  });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Unauthorized");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/refresh preserves requester subject and role in refreshed token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const originalUser = { sub: "usr_custom_12345", role: "freelancer" };
  const validToken = signAccessToken(originalUser);

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${validToken}`
    }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data?.token);

  // Verify refreshed token preserves original subject and role
  const decoded = verifyAccessToken(payload.data.token);
  assert.equal(decoded.sub, originalUser.sub);
  assert.equal(decoded.role, originalUser.role);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
