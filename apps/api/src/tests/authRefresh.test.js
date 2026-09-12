import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

function jsonPost(port, path, body, headers = {}) {
  return fetch(`http://127.0.0.1:${port}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

async function startApp() {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  const { port } = server.address();
  return { server, port };
}

test("POST /api/auth/refresh without token → 401", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/auth/refresh", {});
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
});

test("POST /api/auth/refresh with invalid token → 401", async () => {
  const { port } = await startApp();
  const res = await jsonPost(port, "/api/auth/refresh", {}, {
    Authorization: "Bearer invalid.token.here",
  });
  const body = await res.json();
  assert.equal(res.status, 401);
  assert.equal(body.success, false);
});

test("POST /api/auth/refresh with valid token preserves subject and role", async () => {
  const { port } = await startApp();

  // Register to get a valid token
  const regRes = await jsonPost(port, "/api/auth/register", {
    email: "refresh-test@test.com",
    password: "refreshpass123",
    role: "freelancer",
  });
  const regBody = await regRes.json();
  const originalToken = regBody.data.token;

  // Decode original token
  const origPayload = JSON.parse(
    Buffer.from(originalToken.split(".")[1], "base64url").toString("utf8")
  );

  // Refresh
  const refreshRes = await jsonPost(port, "/api/auth/refresh", {}, {
    Authorization: `Bearer ${originalToken}`,
  });
  const refreshBody = await refreshRes.json();
  assert.equal(refreshRes.status, 200);
  assert.equal(refreshBody.success, true);

  // Decode refreshed token
  const newToken = refreshBody.data.token;
  const newPayload = JSON.parse(
    Buffer.from(newToken.split(".")[1], "base64url").toString("utf8")
  );

  // Subject and role must match the original authenticated user
  assert.equal(newPayload.sub, origPayload.sub);
  assert.equal(newPayload.role, origPayload.role);
  // The refreshed token preserves subject and role
  assert.ok(typeof newToken === "string");
  assert.ok(newToken.length > 20);
});