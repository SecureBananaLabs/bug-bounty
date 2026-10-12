import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken, verifyAccessToken } from "../utils/jwt.js";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("listening", () => resolve(server.address().port));
    server.once("error", reject);
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /api/auth/refresh requires an access token", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  });

  assert.equal(response.status, 401);

  await close(server);
});

test("POST /api/auth/refresh keeps the subject and role", async () => {
  const app = createApp();
  const server = app.listen(0);
  const port = await listen(server);

  const token = signAccessToken({ sub: "usr_42", role: "admin" });
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: "{}"
  });
  const payload = await response.json();

  assert.equal(response.status, 200);
  const refreshed = verifyAccessToken(payload.data.token);
  assert.equal(refreshed.sub, "usr_42");
  assert.equal(refreshed.role, "admin");

  await close(server);
});
