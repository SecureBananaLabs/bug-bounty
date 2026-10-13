import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("POST /api/auth/register rejects admin role with 400 Bad Request", async () => {
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
      email: "attacker@example.com",
      password: "correct-horse-battery-staple",
      role: "admin"
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.message, "Validation failed");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("POST /api/auth/register accepts client role with 201 Created", async () => {
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
      email: "user@example.com",
      password: "correct-horse-battery-staple",
      role: "client"
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 201);
  assert.equal(payload.success, true);
  assert.equal(payload.data.role, "client");

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics returns 403 Forbidden for non-admin client token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const clientToken = signAccessToken({ sub: "usr_client_1", role: "client" });
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: {
      Authorization: `Bearer ${clientToken}`
    }
  });

  const payload = await response.json();
  assert.equal(response.status, 403);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics returns 200 OK for admin token", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const adminToken = signAccessToken({ sub: "usr_admin_1", role: "admin" });
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });

  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.success, true);
  assert.ok(payload.data.openJobs !== undefined);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
