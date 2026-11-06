import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { verifyAccessToken } from "../utils/jwt.js";

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

test("POST /api/auth/register signs the token for the id it returns", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "ada@example.com", password: "hunterhunter", role: "client" })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.equal(payload.success, true);

  const claims = verifyAccessToken(payload.data.token);

  assert.equal(claims.sub, payload.data.id);
  assert.equal(claims.role, "client");

  await close(server);
});

test("POST /api/auth/register keeps the supplied email and role", async () => {
  const server = await listen(createApp());
  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "grace@example.com",
      password: "hunterhunter",
      role: "freelancer"
    })
  });
  const payload = await response.json();

  assert.equal(payload.data.email, "grace@example.com");
  assert.equal(payload.data.role, "freelancer");
  assert.match(payload.data.id, /^usr_/);

  await close(server);
});
