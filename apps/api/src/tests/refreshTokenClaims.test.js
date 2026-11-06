import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function listen(app) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => resolve(server));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/refresh without a token is rejected", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, { method: "POST" });
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);

  await close(server);
});

test("POST /api/auth/refresh keeps the subject and role of the presented token", async () => {
  const server = await listen(createApp());
  const { port } = server.address();
  const token = signAccessToken({ sub: "usr_42", role: "freelancer" });

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.success, true);

  const refreshed = verifyAccessToken(payload.data.token);
  assert.equal(refreshed.sub, "usr_42");
  assert.equal(refreshed.role, "freelancer");

  await close(server);
});
