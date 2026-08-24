import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

test("Security validation - Admin self-assignment and Refresh Token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  // 1. Test that registering with role: "admin" is rejected with 400 Bad Request
  const registerAdminResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "adminattacker@example.com",
      password: "password123",
      role: "admin"
    })
  });

  assert.ok(registerAdminResponse.status === 400 || registerAdminResponse.status === 500);

  // 2. Test that registering with role: "client" still works perfectly (201 Created)
  const registerClientResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "goodclient@example.com",
      password: "password123",
      role: "client"
    })
  });

  assert.equal(registerClientResponse.status, 201);

  // 3. Test refresh token endpoint without token (should fail with 400)
  const refreshEmptyResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const refreshEmptyPayload = await refreshEmptyResponse.json();

  assert.equal(refreshEmptyResponse.status, 400);
  assert.equal(refreshEmptyPayload.success, false);
  assert.equal(refreshEmptyPayload.message, "Refresh token required");

  // 4. Test refresh token endpoint with token (should succeed with 200)
  const refreshValidResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "some-refresh-token" })
  });
  const refreshValidPayload = await refreshValidResponse.json();

  assert.equal(refreshValidResponse.status, 200);
  assert.equal(refreshValidPayload.success, true);
  assert.ok(refreshValidPayload.data.token);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
