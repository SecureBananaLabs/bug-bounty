import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { registerUser } from "../services/authService.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

test("registerUser generates token with subject strictly matching returned user id", async () => {
  const payload = { email: "sync_test@example.com", role: "freelancer" };
  const user = await registerUser(payload);

  assert.ok(user.id.startsWith("usr_"));
  assert.equal(user.email, payload.email);
  assert.equal(user.role, payload.role);

  const decoded = verifyAccessToken(user.token);
  assert.equal(decoded.sub, user.id, "JWT subject must strictly match user id");
  assert.equal(decoded.role, user.role);
});

test("POST /api/auth/register returns matching user id and JWT subject", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "new_developer@example.com",
      password: "SuperSecretPassword123!",
      role: "freelancer"
    })
  });

  assert.equal(response.status, 201);
  const payload = await response.json();
  assert.equal(payload.success, true);
  assert.ok(payload.data.id);
  assert.ok(payload.data.token);

  const decoded = verifyAccessToken(payload.data.token);
  assert.equal(decoded.sub, payload.data.id, "API token sub must equal returned id");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
