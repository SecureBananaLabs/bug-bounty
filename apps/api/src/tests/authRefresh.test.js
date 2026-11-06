import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/refresh without token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });
  assert.equal(response.status, 401);
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh with valid token returns new token for same user", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  
  const token = signAccessToken({ sub: "usr_test123", role: "client" });
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.ok(payload.token);
  
  // Verify the new token has the same subject
  const decoded = JSON.parse(Buffer.from(payload.token.split(".")[1], "base64").toString());
  assert.equal(decoded.sub, "usr_test123");
  assert.equal(decoded.role, "client");
  
  await new Promise((resolve) => server.close(resolve));
});

test("POST /api/auth/refresh with invalid token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer invalid-token-here"
    }
  });
  assert.equal(response.status, 401);
  await new Promise((resolve) => server.close(resolve));
});

