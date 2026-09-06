import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { signAccessToken } from "../utils/jwt.js";

test("GET /api/admin/metrics with non-admin token returns 403", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const clientToken = signAccessToken({ sub: "usr_client", role: "client" });

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${clientToken}` }
  });
  const payload = await response.json();

  assert.equal(response.status, 403);
  assert.equal(payload.success, false);
  assert.ok(payload.message.toLowerCase().includes("forbidden") || payload.message.toLowerCase().includes("insufficient"));

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics with admin token returns 200", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();
  const adminToken = signAccessToken({ sub: "usr_admin", role: "admin" });

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  assert.equal(response.status, 200);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("GET /api/admin/metrics without token returns 401", async () => {
  const app = createApp();
  const server = app.listen(0);

  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const { port } = server.address();

  const response = await fetch(`http://127.0.0.1:${port}/api/admin/metrics`);
  const payload = await response.json();

  assert.equal(response.status, 401);
  assert.equal(payload.success, false);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});
